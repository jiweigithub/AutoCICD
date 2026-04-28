export interface CodeGeneratorService {
  generateFiles(taskId: string, spec: Record<string, unknown>): Promise<string[]>;
}
