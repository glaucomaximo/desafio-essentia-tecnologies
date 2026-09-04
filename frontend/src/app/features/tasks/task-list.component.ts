import { DatePipe } from "@angular/common";
import { Component, input, output } from "@angular/core";
import type { Task, TaskFilter } from "../../core/task.model";

@Component({
  selector: "app-task-list",
  standalone: true,
  imports: [DatePipe],
  template: `
    <section class="min-w-0" aria-labelledby="task-list-title">
      <div
        class="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p class="mb-2 text-xs font-extrabold uppercase tracking-normal text-emerald-700">
              Painel
            </p>
            <h2 id="task-list-title" class="text-2xl font-black text-slate-950">
              Tarefas cadastradas
            </h2>

            @if (userEmail()) {
              <p class="mt-2 text-sm text-slate-500">Sessão ativa: {{ userEmail() }}</p>
            }
          </div>

          <button
            class="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-65"
            type="button"
            (click)="refreshRequested.emit()"
            [disabled]="loading()"
          >
            Atualizar
          </button>
        </div>

        <div class="grid gap-3 sm:grid-cols-3" aria-label="Resumo das tarefas">
          <span
            class="grid min-h-16 place-items-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600"
          >
            <strong class="block text-2xl text-slate-950">{{ totalTasks() }}</strong>
            total
          </span>
          <span
            class="grid min-h-16 place-items-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600"
          >
            <strong class="block text-2xl text-slate-950">{{ pendingTasksCount() }}</strong>
            pendentes
          </span>
          <span
            class="grid min-h-16 place-items-center rounded-lg border border-slate-200 bg-slate-50 p-3 text-center text-sm text-slate-600"
          >
            <strong class="block text-2xl text-slate-950">{{ completedTasksCount() }}</strong>
            concluídas
          </span>
        </div>

        <div
          class="grid overflow-hidden rounded-lg border border-slate-300 sm:grid-cols-3"
          role="group"
          aria-label="Filtrar tarefas"
        >
          <button
            class="min-h-10 bg-white px-3 font-bold text-slate-600 transition data-[active=true]:bg-emerald-700 data-[active=true]:text-white"
            type="button"
            [attr.data-active]="filter() === 'all'"
            (click)="filterChanged.emit('all')"
          >
            Todas
          </button>
          <button
            class="min-h-10 border-t border-slate-300 bg-white px-3 font-bold text-slate-600 transition data-[active=true]:bg-emerald-700 data-[active=true]:text-white sm:border-l sm:border-t-0"
            type="button"
            [attr.data-active]="filter() === 'open'"
            (click)="filterChanged.emit('open')"
          >
            Pendentes
          </button>
          <button
            class="min-h-10 border-t border-slate-300 bg-white px-3 font-bold text-slate-600 transition data-[active=true]:bg-emerald-700 data-[active=true]:text-white sm:border-l sm:border-t-0"
            type="button"
            [attr.data-active]="filter() === 'done'"
            (click)="filterChanged.emit('done')"
          >
            Concluídas
          </button>
        </div>

        @if (loading()) {
          <p class="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
            Carregando tarefas...
          </p>
        }

        @if (errorMessage()) {
          <p class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ errorMessage() }}
          </p>
        }
      </div>

      @if (!loading()) {
        @if (tasks().length > 0) {
          <ul class="grid gap-3 p-0" aria-label="Lista de tarefas">
            @for (task of tasks(); track task.id) {
              <li
                class="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[34px_minmax(0,1fr)_auto] md:items-center"
              >
                <label class="relative grid h-8 w-8 place-items-center">
                  <input
                    class="peer absolute h-8 w-8 opacity-0"
                    type="checkbox"
                    [checked]="task.completed"
                    (change)="taskToggled.emit(task)"
                  />
                  <span
                    class="grid h-6 w-6 place-items-center rounded-md border-2 border-slate-400 bg-white text-white transition peer-checked:border-emerald-700 peer-checked:bg-emerald-700"
                    aria-hidden="true"
                  >
                    @if (task.completed) {
                      <span class="text-sm font-black">✓</span>
                    }
                  </span>
                  <span class="sr-only">
                    {{ task.completed ? "Marcar como pendente" : "Marcar como concluída" }}
                  </span>
                </label>

                <div
                  class="min-w-0"
                  [class.text-slate-500]="task.completed"
                  [class.line-through]="task.completed"
                >
                  <div class="mb-2 flex flex-wrap items-center gap-2">
                    <h3 class="break-words text-base font-black text-slate-950">
                      {{ task.title }}
                    </h3>
                    <span
                      class="inline-flex min-h-6 items-center rounded-md px-2 text-xs font-extrabold"
                      [class.bg-red-50]="task.metadata.priority === 'high'"
                      [class.text-red-700]="task.metadata.priority === 'high'"
                      [class.bg-amber-50]="task.metadata.priority === 'medium'"
                      [class.text-amber-700]="task.metadata.priority === 'medium'"
                      [class.bg-emerald-50]="task.metadata.priority === 'low'"
                      [class.text-emerald-700]="task.metadata.priority === 'low'"
                    >
                      @switch (task.metadata.priority) {
                        @case ("high") {
                          Alta
                        }
                        @case ("low") {
                          Baixa
                        }
                        @default {
                          Média
                        }
                      }
                    </span>
                  </div>

                  @if (task.description) {
                    <p class="mb-3 break-words text-sm text-slate-600">{{ task.description }}</p>
                  }

                  <div class="grid gap-1 text-sm text-slate-500">
                    @if (task.metadata.dueDate) {
                      <small>Prazo {{ task.metadata.dueDate | date: "dd/MM/yyyy" }}</small>
                    }

                    @if (task.metadata.notes) {
                      <small class="break-words">{{ task.metadata.notes }}</small>
                    }
                  </div>

                  @if (task.metadata.tags.length > 0) {
                    <div class="mt-3 flex flex-wrap gap-2">
                      @for (tag of task.metadata.tags; track $index) {
                        <span
                          class="inline-flex min-h-6 items-center rounded-md bg-blue-50 px-2 text-xs font-extrabold text-blue-700"
                        >
                          {{ tag }}
                        </span>
                      }
                    </div>
                  }

                  <small class="mt-3 block text-xs text-slate-500">
                    Atualizada em {{ task.updatedAt | date: "dd/MM/yyyy HH:mm" }}
                  </small>
                </div>

                <div class="flex flex-wrap gap-2 md:justify-end">
                  <button
                    class="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-bold text-slate-700 transition hover:bg-slate-50"
                    type="button"
                    (click)="taskEditRequested.emit(task)"
                  >
                    Editar
                  </button>
                  <button
                    class="min-h-10 rounded-md border border-red-200 bg-red-50 px-4 font-bold text-red-700 transition hover:bg-red-100"
                    type="button"
                    (click)="taskRemovalRequested.emit(task)"
                  >
                    Remover
                  </button>
                </div>
              </li>
            }
          </ul>
        } @else {
          <div class="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <strong class="block text-slate-950">Nenhuma tarefa encontrada</strong>
            <p class="mt-2 text-sm text-slate-600">
              Cadastre uma tarefa ou altere o filtro selecionado.
            </p>
          </div>
        }
      }
    </section>
  `
})
export class TaskListComponent {
  readonly tasks = input.required<Task[]>();
  readonly totalTasks = input.required<number>();
  readonly pendingTasksCount = input.required<number>();
  readonly completedTasksCount = input.required<number>();
  readonly filter = input.required<TaskFilter>();
  readonly loading = input.required<boolean>();
  readonly errorMessage = input.required<string>();
  readonly userEmail = input<string | null>(null);
  readonly refreshRequested = output<void>();
  readonly filterChanged = output<TaskFilter>();
  readonly taskToggled = output<Task>();
  readonly taskEditRequested = output<Task>();
  readonly taskRemovalRequested = output<Task>();
}
