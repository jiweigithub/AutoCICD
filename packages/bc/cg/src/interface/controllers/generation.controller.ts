import { Controller, Post, Body } from '@nestjs/common';
import { StartGenerationUseCase } from '../../application/use-cases/index.js';
import type { StartGenerationDto } from '../dto/index.js';

@Controller('generation')
export class GenerationController {
  constructor(private readonly startGenerationUseCase: StartGenerationUseCase) {}

  @Post()
  async start(@Body() dto: StartGenerationDto) {
    return this.startGenerationUseCase.execute(dto);
  }
}
