import { HttpErrorResponse } from "@angular/common/http";
import { Injectable, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { FormBuilder, FormControl, FormGroup, Validators } from "@angular/forms";
import { BehaviorSubject, catchError, finalize, of, switchMap } from "rxjs";
import { AuthApiService } from "./auth-api.service";
import { AuthStorage } from "./auth-storage";
import type { AuthSession } from "./auth.model";
import { TaskApiService } from "./task-api.service";
import type { Task, TaskFilter, TaskFormPayload, TaskPriority } from "./task.model";

export type AuthMode = "login" | "register";

export type AuthFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}>;

export type TaskEditorFormGroup = FormGroup<{
  title: FormControl<string>;
  description: FormControl<string>;
  priority: FormControl<TaskPriority>;
  dueDate: FormControl<string>;
  tags: FormControl<string>;
  notes: FormControl<string>;
}>;

@Injectable({
  providedIn: "root"
})
export class TaskWorkspaceFacade {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStorage = inject(AuthStorage);
  private readonly taskApi = inject(TaskApiService);
  private readonly refreshTasks = new BehaviorSubject<void>(undefined);

  readonly authForm: AuthFormGroup = this.formBuilder.nonNullable.group({
    name: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ["", [Validators.required, Validators.email, Validators.maxLength(254)]],
    password: [
      "",
      [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[A-Za-z])(?=.*\d).+$/)
      ]
    ]
  });

  readonly taskForm: TaskEditorFormGroup = this.formBuilder.nonNullable.group({
    title: ["", [Validators.required, Validators.maxLength(180)]],
    description: [""],
    priority: ["medium" as TaskPriority, [Validators.required]],
    dueDate: [""],
    tags: ["", [Validators.maxLength(420)]],
    notes: ["", [Validators.maxLength(1000)]]
  });

  readonly session = signal<AuthSession | null>(this.authStorage.loadSession());
  readonly authMode = signal<AuthMode>("login");
  readonly authLoading = signal(false);
  readonly authErrorMessage = signal("");
  readonly filter = signal<TaskFilter>("all");
  readonly editingTaskId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal("");
  readonly taskPendingRemoval = signal<Task | null>(null);

  readonly isAuthenticated = computed(() => this.session() !== null);

  // Ponte controlada: HTTP continua em RxJS, enquanto o template consome Signals.
  readonly tasks = toSignal(
    this.refreshTasks.pipe(
      switchMap(() => {
        if (!this.isAuthenticated()) {
          return of<Task[]>([]);
        }

        this.loading.set(true);
        this.errorMessage.set("");

        return this.taskApi.getTasks().pipe(
          catchError((error: unknown) => {
            this.handleTaskError(error, "Não foi possível carregar as tarefas.");
            return of<Task[]>([]);
          }),
          finalize(() => this.loading.set(false))
        );
      })
    ),
    { initialValue: [] as Task[] }
  );

  readonly visibleTasks = computed(() => {
    const tasks = this.tasks();

    if (this.filter() === "open") {
      return tasks.filter((task) => !task.completed);
    }

    if (this.filter() === "done") {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  });

  readonly pendingTasksCount = computed(
    () => this.tasks().filter((task) => !task.completed).length
  );

  readonly completedTasksCount = computed(
    () => this.tasks().filter((task) => task.completed).length
  );

  readonly isEditing = computed(() => this.editingTaskId() !== null);

  setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
    this.authErrorMessage.set("");
  }

  submitAuth(): void {
    if (this.authFormHasInvalidFields()) {
      this.touchAuthFields();
      return;
    }

    const request =
      this.authMode() === "register"
        ? this.authApi.register({
            name: this.authForm.controls.name.value.trim(),
            email: this.authForm.controls.email.value.trim().toLowerCase(),
            password: this.authForm.controls.password.value
          })
        : this.authApi.login({
            email: this.authForm.controls.email.value.trim().toLowerCase(),
            password: this.authForm.controls.password.value
          });

    this.authLoading.set(true);
    this.authErrorMessage.set("");

    request.pipe(finalize(() => this.authLoading.set(false))).subscribe({
      next: (session) => {
        this.authStorage.saveSession(session);
        this.session.set(session);
        this.authForm.controls.password.reset("");
        this.loadTasks();
      },
      error: (error: unknown) => {
        this.authErrorMessage.set(this.authFailureMessage(error));
      }
    });
  }

  logout(): void {
    this.clearAuthenticatedState();
    this.loadTasks();
  }

  loadTasks(): void {
    this.refreshTasks.next();
  }

  setFilter(filter: TaskFilter): void {
    this.filter.set(filter);
  }

  submitTask(): void {
    if (this.taskForm.invalid) {
      this.taskForm.markAllAsTouched();
      return;
    }

    const payload = this.taskPayloadFromForm();
    const editingTaskId = this.editingTaskId();
    const request =
      editingTaskId === null
        ? this.taskApi.createTask(payload)
        : this.taskApi.updateTask(editingTaskId, payload);

    this.saving.set(true);
    this.errorMessage.set("");

    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadTasks();
      },
      error: (error: unknown) => {
        this.handleTaskError(error, "Não foi possível salvar a tarefa.");
      }
    });
  }

  startEditing(task: Task): void {
    this.editingTaskId.set(task.id);
    this.taskForm.setValue({
      title: task.title,
      description: task.description ?? "",
      priority: task.metadata.priority,
      dueDate: task.metadata.dueDate ?? "",
      tags: task.metadata.tags.join(", "),
      notes: task.metadata.notes ?? ""
    });
  }

  resetForm(): void {
    this.editingTaskId.set(null);
    this.taskForm.reset({
      title: "",
      description: "",
      priority: "medium",
      dueDate: "",
      tags: "",
      notes: ""
    });
  }

  toggleTask(task: Task): void {
    this.taskApi.updateTask(task.id, { completed: !task.completed }).subscribe({
      next: () => this.loadTasks(),
      error: (error: unknown) => {
        this.handleTaskError(error, "Não foi possível atualizar o status da tarefa.");
      }
    });
  }

  requestTaskRemoval(task: Task): void {
    this.taskPendingRemoval.set(task);
  }

  cancelTaskRemoval(): void {
    this.taskPendingRemoval.set(null);
  }

  confirmTaskRemoval(): void {
    const task = this.taskPendingRemoval();

    if (!task) {
      return;
    }

    this.taskApi.deleteTask(task.id).subscribe({
      next: () => {
        this.taskPendingRemoval.set(null);
        this.loadTasks();
      },
      error: (error: unknown) => {
        this.handleTaskError(error, "Não foi possível remover a tarefa.");
      }
    });
  }

  private authFormHasInvalidFields(): boolean {
    const controls = this.authForm.controls;
    const invalidName = this.authMode() === "register" && controls.name.invalid;

    return invalidName || controls.email.invalid || controls.password.invalid;
  }

  private touchAuthFields(): void {
    if (this.authMode() === "register") {
      this.authForm.controls.name.markAsTouched();
    }

    this.authForm.controls.email.markAsTouched();
    this.authForm.controls.password.markAsTouched();
  }

  private taskPayloadFromForm(): TaskFormPayload {
    const tags = this.taskForm.controls.tags.value
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

    return {
      title: this.taskForm.controls.title.value.trim(),
      description: this.taskForm.controls.description.value.trim() || null,
      metadata: {
        priority: this.taskForm.controls.priority.value,
        dueDate: this.taskForm.controls.dueDate.value || null,
        tags,
        notes: this.taskForm.controls.notes.value.trim() || null
      }
    };
  }

  private handleTaskError(error: unknown, message: string): void {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      this.clearAuthenticatedState();
      this.authErrorMessage.set("Sessão expirada. Entre novamente.");
      return;
    }

    this.errorMessage.set(message);
  }

  private authFailureMessage(error: unknown): string {
    if (!(error instanceof HttpErrorResponse)) {
      return "Não foi possível concluir a solicitação. Tente novamente.";
    }

    if (error.status === 409) {
      return "Este e-mail já está cadastrado. Use a opção Entrar ou informe outro e-mail.";
    }

    if (error.status === 401) {
      return "E-mail ou senha inválidos.";
    }

    if (error.status === 400) {
      return "Revise nome, e-mail e senha antes de continuar.";
    }

    if (error.status === 0) {
      return "API indisponível. Confirme se o backend está em execução.";
    }

    return "Não foi possível concluir a solicitação. Tente novamente.";
  }

  private clearAuthenticatedState(): void {
    this.authStorage.clearSession();
    this.session.set(null);
    this.filter.set("all");
    this.errorMessage.set("");
    this.taskPendingRemoval.set(null);
    this.resetForm();
  }
}
