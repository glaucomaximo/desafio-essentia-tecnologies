import { Component, input, output } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import type { TaskEditorFormGroup } from "../../core/task-workspace.facade";

@Component({
  selector: "app-task-form",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section
      class="self-start rounded-lg border border-slate-200 bg-white/95 p-6 shadow-sm"
      aria-labelledby="task-form-title"
    >
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-normal text-emerald-700">
            Cadastro
          </p>
          <h2 id="task-form-title" class="text-2xl font-black text-slate-950">
            {{ isEditing() ? "Editar tarefa" : "Nova tarefa" }}
          </h2>
        </div>

        @if (isEditing()) {
          <button
            class="min-h-10 rounded-md border border-slate-300 bg-white px-4 font-bold text-slate-700 transition hover:bg-slate-50"
            type="button"
            (click)="formReset.emit()"
          >
            Cancelar
          </button>
        }
      </div>

      <form class="grid gap-3" [formGroup]="form()" (ngSubmit)="formSubmitted.emit()">
        <label class="text-sm font-bold text-slate-800" for="task-title">Título</label>
        <input
          id="task-title"
          class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          type="text"
          formControlName="title"
          maxlength="180"
          placeholder="Ex.: Revisar relatório"
        />

        @if (form().controls.title.touched && form().controls.title.invalid) {
          <p class="-mt-1 text-sm text-red-700">Informe um título com até 180 caracteres.</p>
        }

        <label class="text-sm font-bold text-slate-800" for="task-description">Descrição</label>
        <textarea
          id="task-description"
          class="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          rows="4"
          formControlName="description"
          placeholder="Detalhes opcionais para orientar a execução"
        ></textarea>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="grid gap-3">
            <label class="text-sm font-bold text-slate-800" for="task-priority">Prioridade</label>
            <select
              id="task-priority"
              class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
              formControlName="priority"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          <div class="grid gap-3">
            <label class="text-sm font-bold text-slate-800" for="task-due-date">Prazo</label>
            <input
              id="task-due-date"
              class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
              type="date"
              formControlName="dueDate"
            />
          </div>
        </div>

        <label class="text-sm font-bold text-slate-800" for="task-tags">Etiquetas</label>
        <input
          id="task-tags"
          class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          type="text"
          formControlName="tags"
          maxlength="420"
          placeholder="api, documentação, segurança"
        />

        <label class="text-sm font-bold text-slate-800" for="task-notes">Observações</label>
        <textarea
          id="task-notes"
          class="min-h-28 w-full resize-y rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          rows="4"
          formControlName="notes"
          maxlength="1000"
          placeholder="Contexto, critério ou lembrete"
        ></textarea>

        <button
          class="mt-2 min-h-11 rounded-md bg-emerald-700 px-4 font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-65"
          type="submit"
          [disabled]="saving()"
        >
          {{ saving() ? "Salvando..." : isEditing() ? "Salvar alterações" : "Adicionar tarefa" }}
        </button>
      </form>
    </section>
  `
})
export class TaskFormComponent {
  readonly form = input.required<TaskEditorFormGroup>();
  readonly isEditing = input.required<boolean>();
  readonly saving = input.required<boolean>();
  readonly formSubmitted = output<void>();
  readonly formReset = output<void>();
}
