import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateKeyPairDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'API key para la cual se generará un par de claves',
    example: 'example-api-key',
  })
  apikey: string;
}
