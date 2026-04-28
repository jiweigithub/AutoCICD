export interface SprintPlanningService {
  assignStoryToSprint(storyId: string, sprintId: string): Promise<void>;
  calculateSprintCapacity(sprintId: string): Promise<number>;
}
