
import { Component, ChangeDetectionStrategy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent, Step } from './components/sidebar/sidebar.component';
import { EditorComponent } from './components/editor/editor.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { GeminiService } from './services/gemini.service';

interface StudySection {
  title: string;
  content: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, SidebarComponent, EditorComponent, ToolbarComponent],
})
export class AppComponent {
  private geminiService = new GeminiService();
  
  readonly studySections = signal<StudySection[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  readonly fullDocument = computed(() => {
    return this.studySections().map(section => `## ${section.title}\n\n${section.content}`).join('\n\n---\n\n');
  });

  async onGenerate(event: { step: Step, context: string, previousContent: string }) {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const prompt = this.createPrompt(event.step, event.context, event.previousContent);
      const result = await this.geminiService.generateContent(prompt);
      
      this.studySections.update(sections => {
        const existingIndex = sections.findIndex(s => s.title === event.step.title);
        const newSection = { title: event.step.title, content: result };
        if (existingIndex > -1) {
          sections[existingIndex] = newSection;
          return [...sections];
        } else {
          return [...sections, newSection];
        }
      });

    } catch (e) {
      console.error(e);
      this.error.set('Failed to generate content. Please check your connection and API key.');
    } finally {
      this.isLoading.set(false);
    }
  }

  private createPrompt(step: Step, context: string, previousContent: string): string {
    const baseInstruction = "You are an expert research scientist and academic writer specializing in grant proposals for biomedical and psychological research. Your task is to assist users in designing robust scientific studies based on their grant application details. Provide clear, concise, and scientifically sound text for the requested section. When asked to generate data, provide it in a clean, machine-readable format like CSV.";

    let prompt = `${baseInstruction}\n\n`;
    if (previousContent) {
      prompt += `Here is the study content so far for context:\n\n---\n${previousContent}\n---\n\n`;
    }
    
    prompt += `Now, please generate the '${step.title}' section. `;

    switch(step.id) {
      case 'abstract':
        return prompt + `Use the following keywords and core ideas to write a compelling, 250-word abstract for the grant application:\n\n${context}`;
      case 'hypothesis':
        return prompt + `Based on the provided abstract, formulate one primary hypothesis and two secondary hypotheses:\n\n${context}`;
      case 'methodology':
        return prompt + `Based on the abstract and hypotheses, design a detailed methodology. Include sections for Participant Recruitment, Experimental Procedure, and Data Collection Techniques. Specify whether fMRI, EEG, or behavioral data is most appropriate. \n\nAbstract:\n${context}`;
      case 'data_simulation':
        return prompt + `Based on the previously defined methodology, generate a sample dataset in CSV format for a study with 20 participants. The dataset should simulate realistic data (e.g., fMRI BOLD signals, EEG microvolts, or behavioral response times). Include clear column headers.`;
      default:
        return prompt + `Write a section based on the following information:\n\n${context}`;
    }
  }
}
