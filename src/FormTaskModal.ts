import { App, Modal, Setting, Plugin } from "obsidian";
import * as chrono from "chrono-node";
import { getDateString, getNewTaskPath } from "src/main";
import FileTasksPlugin from "src/main";
import { TagSuggest } from "./TagSuggest";

export interface TaskProperties {
	state?: boolean;
	name?: string;
	due?: Date;
	notes?: string;
	[key: string]: string[] | string | boolean | Date | undefined;
}

interface FormTaskModalOptions {
	plugin: FileTasksPlugin;
	title?: string;
	result?: TaskProperties;
	onSubmit: (result: TaskProperties) => void;
}

export class FormTaskModal extends Modal {
	plugin: FileTasksPlugin;
	result: TaskProperties;
	title: string;
	error: string | undefined;
	onSubmit: (result: TaskProperties) => void;
	previewEl: HTMLElement;
	bodyEl: HTMLElement;

	constructor(options: FormTaskModalOptions) {
		const { plugin, title, result, onSubmit } = options;

		super(plugin.app);
		this.plugin = plugin;
		this.result = result || {};
		this.title = title || "Add a Task";

		this.plugin.settings.customTags.forEach((tag) => {
			this.result[tag] = [""];
		});

		this.onSubmit = onSubmit;
	}

	renderPreview() {
		this.previewEl.empty();

		if (this.result.name) {
			let text = this.result.name;
			let cls = "file-tasks-preview";

			if (this.result.due) {
				text += ` due ${window
					.moment(this.result.due)
					.format("ddd MMM Do YYYY")}`;
			}

			if (this.error) {
				text = this.error;
				cls += " file-tasks-preview-error";
			}

			this.previewEl.createEl("div", {
				text,
				cls,
			});
		}
	}

	addDueSetting(el: HTMLElement) {
		new Setting(el).setName("Due Date").addText((text) =>
			text
				.setValue(this.result.due ? getDateString(this.result.due) : "")
				.onChange((value) => {
					try {
						this.result.due = chrono.parseDate(value);
						this.renderPreview();
					} catch (e) {}
				})
		);
	}

	addCustomTagSetting(el: HTMLElement, tag: string) {
		(this.result[tag as string] as string[]).forEach((tagValue, index) => {
			new Setting(el)
				.setName(`Tag: ${tag}`)
				.setDesc("Custom tag added in Settings")
				.addSearch((cb) => {
					new TagSuggest(cb.inputEl);
					cb.setPlaceholder(`#${tag}/tag-value`)
						.setValue(tagValue || `#${tag}/`)
						.onChange((value) => {
							(this.result[tag] as string[])[index] = value;
						});

					// @ts-ignore
					// cb.containerEl.addClass("templater_search");
				})
				.addExtraButton((btn) =>
					btn
						.setIcon("cross")
						.setTooltip("Remove tag")
						.onClick(() => {
							(this.result[tag] as string[]).splice(index, 1);
							this.renderBody();
						})
				);

			// new Setting(el)
			// 	.setName(`Custom Tag: ${tag}`)
			// 	.addText((text) =>
			// 		text.setValue(tagValue || "").onChange((value) => {
			// 			(this.result[tag] as string[])[index] = value;
			// 		})
			// 	)
			// 	.addExtraButton((btn) =>
			// 		btn
			// 			.setIcon("cross")
			// 			.setTooltip("Remove tag")
			// 			.onClick(() => {
			// 				(this.result[tag] as string[]).splice(index, 1);
			// 				this.renderBody();
			// 			})
			// 	);
		});

		new Setting(el).addButton((btn) =>
			btn
				.setButtonText(`Add Custom Tag: ${tag}`)
				.setCta()
				.onClick(() => {
					(this.result[tag] as string[]).push("");
					this.renderBody();
				})
		);
	}

	renderNameSetting(el: HTMLElement) {
		new Setting(el).setName("New Task Name").addText((text) =>
			text.setValue(this.result.name || "").onChange((value) => {
				this.result.name = value;
				const path = getNewTaskPath(this.result);
				const existingFile = this.app.vault.getAbstractFileByPath(path);

				this.error = existingFile
					? "A file with that name already exists."
					: undefined;

				this.renderPreview();
			})
		);
	}

	renderDoneSetting(el: HTMLElement) {
		new Setting(el).setName("Done").addToggle((toggle) =>
			toggle.setValue(this.result.state || false).onChange((value) => {
				this.result.state = value;
			})
		);
	}

	renderSubmitButton(el: HTMLElement) {
		new Setting(el).addButton((btn) =>
			btn
				.setButtonText("Create Task")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.result);
				})
		);
	}

	renderBody() {
		const { bodyEl } = this;
		bodyEl.empty();

		this.renderNameSetting(bodyEl);
		this.plugin.settings.customTags.forEach((tag) =>
			this.addCustomTagSetting(bodyEl, tag)
		);
		this.addDueSetting(bodyEl);
		this.renderDoneSetting(bodyEl);
		this.renderSubmitButton(bodyEl);
	}

	onOpen() {
		const { contentEl, titleEl } = this;
		titleEl.setText(this.title);

		this.previewEl = contentEl.createEl("div");
		this.bodyEl = contentEl.createEl("div");

		this.renderPreview();
		this.renderBody();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
