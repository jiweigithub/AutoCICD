import { describe, it, expect } from 'vitest';
import {
  Project, Sprint, Story,
  SprintDuration,
  CreateProjectUseCase, CreateStoryUseCase, CommitSprintUseCase,
  BCProjectManagementModule,
} from '../../src/index.js';

describe('BC-PM public API', () => {
  it('should export domain entities', () => {
    expect(Project).toBeDefined();
    expect(Sprint).toBeDefined();
    expect(Story).toBeDefined();
  });

  it('should export value objects', () => {
    expect(SprintDuration).toBeDefined();
  });

  it('should export application use cases', () => {
    expect(CreateProjectUseCase).toBeDefined();
    expect(CreateStoryUseCase).toBeDefined();
    expect(CommitSprintUseCase).toBeDefined();
  });

  it('should export NestJS module', () => {
    expect(BCProjectManagementModule).toBeDefined();
  });

  it('should create a Project with correct defaults', () => {
    const project = new Project('p1', 'My Project', 'A test project');
    expect(project.id).toBe('p1');
    expect(project.name).toBe('My Project');
    expect(project.status).toBe('active');
    expect(project.version).toBe(1);
  });

  it('should create a Story and transition status', () => {
    const story = new Story('s1', 'sp1', 'Test Story', 3, 'high', 'Do X');
    expect(story.status).toBe('backlog');
    story.markReady();
    expect(story.status).toBe('ready');
  });

  it('should guard against empty names in Project', () => {
    expect(() => new Project('p1', '', 'desc')).toThrow('name');
  });

  it('should guard against negative points in Story', () => {
    expect(() => new Story('s1', 'sp1', 'Test', -1)).toThrow();
  });

  it('should enforce Sprint state transitions', () => {
    const sprint = new Sprint('s1', 'p1', 'Sprint Goal', new Date(), new Date(Date.now() + 86400000), 'planning');
    sprint.commit();
    expect(sprint.status).toBe('active');
    expect(() => sprint.commit()).toThrow('Only planning sprints');
  });
});
