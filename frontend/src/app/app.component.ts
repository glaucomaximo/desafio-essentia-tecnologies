import { CommonModule } from "@angular/common";
import { HttpErrorResponse } from "@angular/common/http";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { AuthApiService } from "./core/auth-api.service";
import { AuthStorage } from "./core/auth-storage";
import type { AuthSession } from "./core/auth.model";
import { TaskApiService } from "./core/task-api.service";
import type { Task, TaskFilter, TaskFormPayload, TaskPriority } from "./core/task.model";

type AuthMode = "login" | "register";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStorage = inject(AuthStorage);
  private readonly taskApi = inject(TaskApiService);

  readonly authForm = this.formBuilder.nonNullable.group({
    name: [
      "Glauco Maximo",
      [Validators.required, Validators.minLength(2), Validators.maxLength(120)]
    ],
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

  readonly taskForm = this.formBuilder.nonNullable.group({
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
  readonly tasks = signal<Task[]>([]);
  readonly filter = signal<TaskFilter>("all");
  readonly editingTaskId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal("");

  readonly isAuthenticated = computed(() => this.session() !== null);

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

  ngOnInit(): void {
    if (this.isAuthenticated()) {
      this.loadTasks();
    }
  }

  setAuthMode(mode: AuthMode): void {
    this.authMode.set(mode);
    this.authErrorMessage.set("");
  }

  submitAuth(): void {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
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
      error: () => {
        this.authErrorMessage.set("Nao foi possivel autenticar com os dados informados.");
      }
    });
  }

  logout(): void {
    this.authStorage.clearSession();
    this.session.set(null);
    this.tasks.set([]);
    this.filter.set("all");
    this.errorMessage.set("");
    this.resetForm();
  }

  loadTasks(): void {
    if (!this.isAuthenticated()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set("");

    this.taskApi
      .getTasks()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
        },
        error: (error: unknown) => {
          this.handleTaskError(error, "Nao foi possivel carregar as tarefas.");
        }
      });
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
        this.handleTaskError(error, "Nao foi possivel salvar a tarefa.");
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
      next: (updatedTask) => {
        this.tasks.update((tasks) =>
          tasks.map((currentTask) =>
            currentTask.id === updatedTask.id ? updatedTask : currentTask
          )
        );
      },
      error: (error: unknown) => {
        this.handleTaskError(error, "Nao foi possivel atualizar o status da tarefa.");
      }
    });
  }

  removeTask(task: Task): void {
    const shouldRemove = window.confirm(`Remover a tarefa "${task.title}"?`);

    if (!shouldRemove) {
      return;
    }

    this.taskApi.deleteTask(task.id).subscribe({
      next: () => {
        this.tasks.update((tasks) => tasks.filter((currentTask) => currentTask.id !== task.id));
      },
      error: (error: unknown) => {
        this.handleTaskError(error, "Nao foi possivel remover a tarefa.");
      }
    });
  }

  trackByTaskId(_index: number, task: Task): number {
    return task.id;
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
      this.logout();
      this.authErrorMessage.set("Sessao expirada. Entre novamente.");
      return;
    }

    this.errorMessage.set(message);
  }
}
