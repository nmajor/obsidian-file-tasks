import { TAbstractFile, TFile } from "obsidian";
import { TextInputSuggest } from "./TextInputSuggest";
import { getAllTags } from "obsidian";

export class TagSuggest extends TextInputSuggest<string> {
	constructor(public inputEl: HTMLInputElement) {
		super(inputEl);
	}

	getSuggestions(inputStr: string): string[] {
		console.log("blah hi there start");
		const abstractFiles = app.vault.getAllLoadedFiles();
		console.log("blah hi abstractFiles", abstractFiles);
		const tags: { [key: string]: boolean } = {};
		const lowerCaseInputStr = inputStr.toLowerCase();

		abstractFiles.forEach((file: TAbstractFile) => {
			if (!(file instanceof TFile)) return;

			const cache = window.app.metadataCache.getFileCache(file as TFile);
			if (!cache) return;

			const cachedTags = getAllTags(cache) || [];
			cachedTags.forEach((tag) => {
				console.log("blah hi tag", tag);
				if (tag.toLowerCase().includes(lowerCaseInputStr)) {
					tags[tag] = true;
				}
			});
		});

		return Object.keys(tags);
	}

	renderSuggestion(tag: string, el: HTMLElement): void {
		el.setText(tag);
	}

	selectSuggestion(tag: string): void {
		this.inputEl.value = tag;
		this.inputEl.trigger("input");
		this.close();
	}
}
