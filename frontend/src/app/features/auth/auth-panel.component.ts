import { Component, input, output } from "@angular/core";
import { ReactiveFormsModule } from "@angular/forms";
import type { AuthFormGroup, AuthMode } from "../../core/task-workspace.facade";

@Component({
  selector: "app-auth-panel",
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section
      class="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      aria-labelledby="auth-title"
    >
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <p class="mb-2 text-xs font-extrabold uppercase tracking-normal text-emerald-700">
            Acesso
          </p>
          <h2 id="auth-title" class="text-2xl font-black text-slate-950">
            {{ mode() === "login" ? "Entrar" : "Criar conta" }}
          </h2>
        </div>
      </div>

      <div
        class="mb-5 grid grid-cols-2 overflow-hidden rounded-lg border border-slate-300"
        role="group"
        aria-label="Escolher modo de acesso"
      >
        <button
          class="min-h-10 bg-white px-3 font-bold text-slate-600 transition data-[active=true]:bg-emerald-700 data-[active=true]:text-white"
          type="button"
          [attr.data-active]="mode() === 'login'"
          (click)="modeChanged.emit('login')"
        >
          Entrar
        </button>
        <button
          class="min-h-10 border-l border-slate-300 bg-white px-3 font-bold text-slate-600 transition data-[active=true]:bg-emerald-700 data-[active=true]:text-white"
          type="button"
          [attr.data-active]="mode() === 'register'"
          (click)="modeChanged.emit('register')"
        >
          Criar conta
        </button>
      </div>

      <form class="grid gap-3" [formGroup]="form()" (ngSubmit)="authSubmitted.emit()">
        @if (mode() === "register") {
          <label class="text-sm font-bold text-slate-800" for="auth-name">Nome</label>
          <input
            id="auth-name"
            class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
            type="text"
            formControlName="name"
            maxlength="120"
            autocomplete="name"
          />

          @if (form().controls.name.touched && form().controls.name.invalid) {
            <p class="-mt-1 text-sm text-red-700">Informe um nome válido.</p>
          }
        }

        <label class="text-sm font-bold text-slate-800" for="auth-email">E-mail</label>
        <input
          id="auth-email"
          class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          type="email"
          formControlName="email"
          maxlength="254"
          autocomplete="email"
        />

        <label class="text-sm font-bold text-slate-800" for="auth-password">Senha</label>
        <input
          id="auth-password"
          class="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/15"
          type="password"
          formControlName="password"
          maxlength="128"
          autocomplete="current-password"
        />

        @if (form().controls.password.touched && form().controls.password.invalid) {
          <p class="-mt-1 text-sm text-red-700">
            Informe uma senha com ao menos 8 caracteres, letras e números.
          </p>
        }

        @if (errorMessage()) {
          <p class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {{ errorMessage() }}
          </p>
        }

        <button
          class="mt-2 min-h-11 rounded-md bg-emerald-700 px-4 font-extrabold text-white transition hover:bg-emerald-800 disabled:opacity-65"
          type="submit"
          [disabled]="loading()"
        >
          {{ loading() ? "Processando..." : mode() === "login" ? "Entrar" : "Criar conta" }}
        </button>
      </form>
    </section>
  `
})
export class AuthPanelComponent {
  readonly form = input.required<AuthFormGroup>();
  readonly mode = input.required<AuthMode>();
  readonly loading = input.required<boolean>();
  readonly errorMessage = input.required<string>();
  readonly modeChanged = output<AuthMode>();
  readonly authSubmitted = output<void>();
}
