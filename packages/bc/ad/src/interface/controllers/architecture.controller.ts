import { Controller, Post, Body } from '@nestjs/common';
import { CreateArchitectureSpecUseCase, ApproveArchitectureUseCase } from '../../application/use-cases/index.js';
import type { CreateArchitectureSpecDto } from '../dto/index.js';

@Controller('architecture')
export class ArchitectureController {
  constructor(
    private readonly createSpecUseCase: CreateArchitectureSpecUseCase,
    private readonly approveSpecUseCase: ApproveArchitectureUseCase,
  ) {}

  @Post('spec')
  async createSpec(@Body() dto: CreateArchitectureSpecDto) {
    return this.createSpecUseCase.execute(dto);
  }

  @Post('approve/:id')
  async approve(@Body('id') id: string) {
    return this.approveSpecUseCase.execute(id);
  }
}
