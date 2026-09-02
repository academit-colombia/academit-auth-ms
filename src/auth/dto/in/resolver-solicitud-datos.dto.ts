import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ResolverSolicitudDatosDto {
  @ApiPropertyOptional({ description: 'Comentario del administrador al aprobar o rechazar' })
  @IsOptional()
  @IsString()
  comentario?: string;
}
