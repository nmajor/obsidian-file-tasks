import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface FileTasksSettings {
	taskTemplatePath: string;
}

const FILE_TASK_DEFAULT_SETTINGS: FileTasksSettings = {
	taskTemplatePath: 'default'
}

export default class MyPlugin extends Plugin {
	settings: FileTasksSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			// new Notice('This is a notice!');
			new NewTaskModal(this.app, (result: NewTaskResult) => {

			}).open();
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			// callback: () => {
			// 	new SampleModal(this.app).open();
			// }
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						// new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, FILE_TASK_DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createTask(task: NewTaskResult) {
		const taskTemplate = await this.app.vault.read(this.settings.taskTemplatePath);
		const taskContent = taskTemplate.replace('{{title}}', task.title).replace('{{tags}}', task.tags.join(' '));
		const taskFile = await this.app.vault.create(task.title + '.md', taskContent);
		await this.app.workspace.openLinkText(taskFile.path, taskFile.path);
	}
}

interface NewTaskResult {
	name: string;
}

class NewTaskModal extends Modal {
	result: NewTaskResult;
	onSubmit: (result: NewTaskResult) => void;

	constructor(app: App, onSubmit: (result: NewTaskResult) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

	onOpen() {
		const {contentEl} = this;

		contentEl.createEl("h1", { text: "Add a Task" });

    new Setting(contentEl)
      .setName("New Task Name")
      .addText((text) =>
        text.onChange((value) => {
          this.result.name = value
        }));

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Submit")
          .setCta()
          .onClick(() => {
            this.close();
            this.onSubmit(this.result);
          }));

		contentEl.innerHTML = `
			<div style="width: 100%">
				<label style="display: block;" for="new-task-name">New Task Name</label>
				<input style="width: 100%; margin: 20px 0" type="text" name="new-task-name" id="file-tasks-input-new-task-name" />
			</div>
			<div style="display: flex; justify-content: end;">
				<button id="file-tasks-button-create-task">Create Task</button>
			</div>
		`;

		(contentEl.querySelector('#file-tasks-button-create-task') as HTMLButtonElement).addEventListener('click', () => {
			const newTaskName = (contentEl.querySelector('#file-tasks-input-new-task-name') as HTMLInputElement)?.value;
			console.log(newTaskName);
			this.close();
		})
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.taskTemplatePath)
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.taskTemplatePath = value;
					await this.plugin.saveSettings();
				}));
	}
}
