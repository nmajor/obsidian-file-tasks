import { Plugin, TFile } from "obsidian";
import { FormTaskModal, TaskProperties } from "./FormTaskModal";
import {
	FileTasksSettings,
	FileTasksSettingsTab,
	FILE_TASK_DEFAULT_SETTINGS,
} from "./FileTasksSettingsTab";

const uncheckedString = "☐";
const checkedString = "☑";
const taskTagPrefix = "tasks";
const pathPrefix = "Tasks";
const notesDelimiter = "--- Task notes below ---";

export const getNewTaskPath = (props: TaskProperties) => {
	const { name, state } = props;

	return `${pathPrefix}/${
		state ? checkedString : uncheckedString
	} ${name}.md`;
};

const getTagLine = (tag: string, value: string, desc?: string) => {
	return `\n${tag}: #${taskTagPrefix}/${tag}/${value}${
		desc ? ` ${desc}` : ""
	}`;
};

export const getNewTaskData = (
	props: TaskProperties,
	settings: FileTasksSettings
) => {
	const { state, notes, due, name } = props;

	let data = `---`;

	// Add name property
	data += `\nname: ${name}`;

	// Add due property
	const dueString = getDateString(due as Date);
	const dueDetailsString = window.moment(due).format("ddd MMM Do YYYY");
	data += getTagLine("due", dueString, dueDetailsString);

	// Add custom tags
	Object.keys(props).forEach((key) => {
		if (Array.isArray(props[key]) && (props[key] as string[]).length > 0) {
			(props[key] as string[]).forEach((value) => {
				data += getTagLine(key, value);
			});
		}
	});

	// Add state property
	data += getTagLine("state", state ? "done" : "todo");

	data += `\n---`;

	// Add footer
	const footerString = state ? settings.doneFooter : settings.todoFooter;
	const trimmedFooterString = footerString.trim();
	data += `\n${trimmedFooterString}`;

	// Add notes
	data += `\n${notesDelimiter}`;
	data += `\n${notes ? notes.trim() : ""}`;

	return data;
};

export const getDateString = (date: Date) => {
	return date.toISOString().split("T")[0]; // "2016-02-18"
};

export default class FileTasksPlugin extends Plugin {
	settings: FileTasksSettings;

	async onload() {
		await this.loadSettings();

		this.addCommand({
			id: "open-add-new-task-modal",
			name: "Add a New Task",
			callback: () => {
				new FormTaskModal({
					plugin: this,
					onSubmit: (result: TaskProperties) => {
						this.createTask(result);
					},
				}).open();
			},
		});

		this.addCommand({
			id: "open-edit-task-modal",
			name: "Update This Task",
			callback: async () => {
				const activeFile = this.getActiveTask();

				if (activeFile instanceof TFile) {
					const props = await this.getTaskPropertiesFromFile(
						activeFile
					);

					new FormTaskModal({
						plugin: this,
						result: props,
						title: "Update This Task",
						onSubmit: (result: TaskProperties) => {
							this.updateTask(activeFile, result);
						},
					}).open();
				}
			},
		});

		this.addCommand({
			id: "mark-task-as-done",
			name: "Mark This Task as Done",
			callback: () => {
				this.markThisTaskDone();
			},
		});

		this.addCommand({
			id: "mark-task-as-todo",
			name: "Mark This Task as Todo",
			callback: () => {
				this.markThisTaskTodo();
			},
		});

		this.addSettingTab(new FileTasksSettingsTab(this.app, this));
	}

	onunload() {}

	async createTask(props: TaskProperties): Promise<TFile> {
		const path = getNewTaskPath(props);
		const data = getNewTaskData(props, this.settings);

		const file = await this.app.vault.create(path, data);
		this.app.workspace.getLeaf("tab").openFile(file);
		return file;
	}

	async updateTask(file: TFile, props: TaskProperties): Promise<TFile> {
		const data = getNewTaskData(props, this.settings);
		const path = getNewTaskPath(props);

		if (path !== file.path) {
			await this.app.fileManager.renameFile(file, path);
		}
		await this.app.vault.modify(file, data);
		return file;
	}

	getActiveTask(): TFile | null {
		const activeFile = this.app.workspace.getActiveFile();
		if (
			activeFile instanceof TFile &&
			new RegExp(`^${pathPrefix}`).test(activeFile.path)
		) {
			return activeFile;
		} else {
			new Notification("Current file is not a task");
		}

		return null;
	}

	async getTaskPropertiesFromFile(file: TFile): Promise<TaskProperties> {
		const { path } = file;
		const data = await this.app.vault.read(file);

		const props: TaskProperties = {};

		const [, name] =
			new RegExp(`^name: +([a-zA-Z0-9- ]+)`, "m").exec(data) || [];
		props.name = name;

		(data.match(/#[a-zA-Z0-9-_\/]+/g) || []).forEach((tag: string) => {
			const parts = tag.split("/");
			const key: string = parts[1];
			const value: string = parts[2];

			if (key === "state" && value) {
				props.state = value === "done";
			} else if (key === "due" && value) {
				props.due = new Date(value);
			} else if (key && value) {
				props[key] = props[key] || [];
				(props[key] as string[]).push(value);
			}
		});

		const [, notes] = data.split(notesDelimiter) || [];
		props.notes = notes;

		return props as TaskProperties;
	}

	async markThisTaskDone() {
		const activeFile = this.getActiveTask();
		if (activeFile instanceof TFile) {
			const props = await this.getTaskPropertiesFromFile(activeFile);
			props.state = true;
			await this.updateTask(activeFile, props);
		}
	}

	async markThisTaskTodo() {
		const activeFile = this.getActiveTask();
		if (activeFile instanceof TFile) {
			const props = await this.getTaskPropertiesFromFile(activeFile);
			props.state = false;
			await this.updateTask(activeFile, props);
		}
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			FILE_TASK_DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
