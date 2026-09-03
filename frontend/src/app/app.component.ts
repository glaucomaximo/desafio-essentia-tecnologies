import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { finalize } from "rxjs";
import { TaskApiService } from "./core/task-api.service";
import type { Task, TaskFilter, TaskFormPayload } from "./core/task.model";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly taskApi = inject(TaskApiService);

  readonly taskForm = this.formBuilder.nonNullable.group({
    title: ["", [Validators.required, Validators.maxLength(180)]],
    description: [""]
  });

  readonly tasks = signal<Task[]>([]);
  readonly filter = signal<TaskFilter>("all");
  readonly editingTaskId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal("");

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
    this.loadTasks();
  }

  loadTasks(): void {
    this.loading.set(true);
    this.errorMessage.set("");

    this.taskApi
      .getTasks()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
        },
        error: () => {
          this.errorMessage.set("Nao foi possivel carregar as tarefas.");
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

    const payload: TaskFormPayload = {
      title: this.taskForm.controls.title.value.trim(),
      description: this.taskForm.controls.description.value.trim() || null
    };

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
      error: () => {
        this.errorMessage.set("Nao foi possivel salvar a tarefa.");
      }
    });
  }

  startEditing(task: Task): void {
    this.editingTaskId.set(task.id);
    this.taskForm.setValue({
      title: task.title,
      description: task.description ?? ""
    });
  }

  resetForm(): void {
    this.editingTaskId.set(null);
    this.taskForm.reset({
      title: "",
      description: ""
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
      error: () => {
        this.errorMessage.set("Nao foi possivel atualizar o status da tarefa.");
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
      error: () => {
        this.errorMessage.set("Nao foi possivel remover a tarefa.");
      }
    });
  }

  trackByTaskId(_index: number, task: Task): number {
    return task.id;
  }
}
