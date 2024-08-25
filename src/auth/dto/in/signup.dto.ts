import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'API key asociada con el usuario',
    example: 'example-api-key',
  })
  apikey: string;
}
