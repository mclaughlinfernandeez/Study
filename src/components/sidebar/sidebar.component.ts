
import { Component, ChangeDetectionStrategy, signal, output, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Step {
  id: string;
  title: string;
  description: string;
  placeholder: string;
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
})
export class SidebarComponent {
  isLoading = input.required<boolean>();
  fullDocument = input.required<string>();
  generate = output<{ step: Step, context: string, previousContent: string }>();

  readonly steps: Step[] = [
    { 
      id: 'abstract', 
      title: 'Project Abstract', 
      description: 'Provide the core summary or abstract from your grant application.',
      placeholder: 'e.g., This study aims to investigate the neural correlates of decision-making under uncertainty using fMRI...'
    },
    { 
      id: 'hypothesis', 
      title: 'Hypothesis Generation', 
      description: 'Generate primary and secondary hypotheses based on the abstract.',
      placeholder: 'Click generate to create hypotheses from the abstract.'
    },
    { 
      id: 'methodology', 
      title: 'Methodology Design', 
      description: 'Design a detailed experimental methodology.',
      placeholder: 'Click generate to create a methodology based on the abstract and hypotheses.'
    },
    { 
      id: 'data_simulation', 
      title: 'Data Simulation', 
      description: 'Generate a sample dataset based on the designed methodology.',
      placeholder: 'Click generate to create a sample CSV dataset.'
    },
  ];

  readonly activeStepIndex = signal(0);
  readonly userInput = signal('');

  selectStep(index: number) {
    this.activeStepIndex.set(index);
  }

  onGenerateClick() {
    const currentStep = this.steps[this.activeStepIndex()];
    let context = this.userInput();
    
    // For subsequent steps, use the full document as context if user input is empty
    if (this.activeStepIndex() > 0 && !context) {
      context = this.fullDocument();
    }
    
    this.generate.emit({ step: currentStep, context: context, previousContent: this.fullDocument() });
    
    // Auto-advance
    if (this.activeStepIndex() < this.steps.length - 1) {
      this.activeStepIndex.update(i => i + 1);
      this.userInput.set(''); // Clear input for next step
    }
  }

  isStepCompleted(index: number): boolean {
    const step = this.steps[index];
    return this.fullDocument().includes(`## ${step.title}`);
  }
}
