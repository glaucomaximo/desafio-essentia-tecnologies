import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
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

  tasks: Task[] = [];
  filter: TaskFilter = "all";
  editingTaskId: number | null = null;
  loading = false;
  saving = false;
  errorMessage = "";

  ngOnInit(): void {
    this.loadTasks();
  }

  get visibleTasks(): Task[] {
    if (this.filter === "open") {
      return this.tasks.filter((task) => !task.completed);
    }

    if (this.filter === "done") {
      return this.tasks.filter((task) => task.completed);
    }

    return this.tasks;
  }

  get pendingTasksCount(): number {
    return this.tasks.filter((task) => !task.completed).length;
  }

  get completedTasksCount(): number {
    return this.tasks.filter((task) => task.completed).length;
  }

  get isEditing(): boolean {
    return this.editingTaskId !== null;
  }

  loadTasks(): void {
    this.loading = true;
    this.errorMessage = "";

    this.taskApi
      .getTasks()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
        },
        error: () => {
          this.errorMessage = "Nao foi possivel carregar as tarefas.";
        }
      });
  }

  setFilter(filter: TaskFilter): void {
    this.filter = filter;
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

    const request =
      this.editingTaskId === null
        ? this.taskApi.createTask(payload)
        : this.taskApi.updateTask(this.editingTaskId, payload);

    this.saving = true;
    this.errorMessage = "";

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.resetForm();
        this.loadTasks();
      },
      error: () => {
        this.errorMessage = "Nao foi possivel salvar a tarefa.";
      }
    });
  }

  startEditing(task: Task): void {
    this.editingTaskId = task.id;
    this.taskForm.setValue({
      title: task.title,
      description: task.description ?? ""
    });
  }

  resetForm(): void {
    this.editingTaskId = null;
    this.taskForm.reset({
      title: "",
      description: ""
    });
  }

  toggleTask(task: Task): void {
    this.taskApi.updateTask(task.id, { completed: !task.completed }).subscribe({
      next: (updatedTask) => {
        this.tasks = this.tasks.map((currentTask) =>
          currentTask.id === updatedTask.id ? updatedTask : currentTask
        );
      },
      error: () => {
        this.errorMessage = "Nao foi possivel atualizar o status da tarefa.";
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
        this.tasks = this.tasks.filter((currentTask) => currentTask.id !== task.id);
      },
      error: () => {
        this.errorMessage = "Nao foi possivel remover a tarefa.";
      }
    });
  }

  trackByTaskId(_index: number, task: Task): number {
    return task.id;
  }
}
