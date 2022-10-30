import { App, PluginSettingTab, Setting } from "obsidian";
import FileTasksPlugin from "src/main";

export interface FileTasksSettings {
	customTags: string[];
	doneFooter: string;
	todoFooter: string;
}

export const FILE_TASK_DEFAULT_SETTINGS: FileTasksSettings = {
	customTags: [],
	doneFooter: "",
	todoFooter: "",
};

export class FileTasksSettingsTab extends PluginSettingTab {
	plugin: FileTasksPlugin;

	constructor(app: App, plugin: FileTasksPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
		containerEl.createEl("h1", { text: "General Settings" });

		this.plugin.settings.customTags.forEach((tag, index) => {
			new Setting(containerEl)
				.setName("Custom Tag")
				.addText((text) =>
					text.setValue(tag || "").onChange((value) => {
						this.plugin.settings.customTags[index] = value;
						this.plugin.saveSettings();
					})
				)
				.addExtraButton((btn) =>
					btn
						.setIcon("cross")
						.setTooltip("Remove Context")
						.onClick(() => {
							this.plugin.settings.customTags.splice(index, 1);
							this.plugin.saveSettings();
							this.display();
						})
				);
		});

		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText("Add Custom Tag")
				.setCta()
				.onClick(() => {
					this.plugin.settings.customTags.push("");
					this.plugin.saveSettings();
					this.display();
				})
		);

		new Setting(containerEl).setName("Done Footer").addTextArea((text) =>
			text
				.setValue(this.plugin.settings.doneFooter || "")
				.onChange((value) => {
					this.plugin.settings.doneFooter = value;
					this.plugin.saveSettings();
				})
		);

		new Setting(containerEl).setName("Todo Footer").addTextArea((text) =>
			text
				.setValue(this.plugin.settings.todoFooter || "")
				.onChange((value) => {
					this.plugin.settings.todoFooter = value;
					this.plugin.saveSettings();
				})
		);
	}
}
