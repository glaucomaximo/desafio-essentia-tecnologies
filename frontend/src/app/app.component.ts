import { Component, inject } from "@angular/core";
import { TaskWorkspaceFacade } from "./core/task-workspace.facade";
import { AuthPanelComponent } from "./features/auth/auth-panel.component";
import { TaskFormComponent } from "./features/tasks/task-form.component";
import { TaskListComponent } from "./features/tasks/task-list.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [AuthPanelComponent, TaskFormComponent, TaskListComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css"
})
export class AppComponent {
  readonly workspace = inject(TaskWorkspaceFacade);
}
