import { Controller, Post, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/in/login.dto';
import { SignupDto } from './dto/in/signup.dto';
import { CreateKeyPairDto } from './dto/in/create-keypair.dto';
import { LoginResponseDto } from './dto/out/login.response.dto';
import { KeyPairResponseDto } from './dto/out/key-pair.response.dto';
import { handleException } from 'src/common/exception/error-handler';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión usando un API key' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, devuelve un JWT',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Fallo en la autenticación. Causas posibles:\n- API key inválida\n- API key inactiva\n- Fallo al desencriptar las credenciales',
  })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Posibles causas:\n- Faltan parámetros requeridos (apikey, encryptedUsername, encryptedPassword)\n- Parámetros con formato incorrecto (Base64 no válido)',
  })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      const { apikey, encryptedUsername, encryptedPassword } = loginDto;
      return await this.authService.login(
        apikey,
        encryptedUsername,
        encryptedPassword,
      );
    } catch (error) {
      handleException(error, {
        unauthorized:
          'Fallo en la autenticación. Verifique su API key y credenciales.',
        badRequest: 'Solicitud inválida. Verifique los parámetros enviados.',
      });
    }
  }

  @Post('signup')
  @ApiOperation({ summary: 'Registrar un nuevo usuario usando un API key' })
  @ApiResponse({
    status: 200,
    description: 'Registro exitoso, devuelve un JWT',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({
    description:
      'Fallo en el registro. Posibles causas:\n- API key inválida o inactiva',
  })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Posibles causas:\n- Faltan parámetros requeridos (apikey)\n- Parámetros con formato incorrecto',
  })
  async signup(@Body() signupDto: SignupDto): Promise<LoginResponseDto> {
    try {
      return await this.authService.signup(signupDto.apikey);
    } catch (error) {
      handleException(error, {
        unauthorized: 'Fallo en el registro. Verifique su API key.',
        badRequest: 'Solicitud inválida. Verifique los parámetros enviados.',
      });
    }
  }

  @Post('create-keypair')
  @ApiOperation({ summary: 'Crear un nuevo par de claves RSA para un API key' })
  @ApiResponse({
    status: 201,
    description: 'Par de claves generado exitosamente',
    type: KeyPairResponseDto,
  })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Posibles causas:\n- Faltan parámetros requeridos (apikey)\n- Error al generar las claves RSA',
  })
  @ApiUnauthorizedResponse({
    description:
      'Fallo en la creación del par de claves. Posibles causas:\n- API key inválida o inactiva',
  })
  async createKeyPair(
    @Body() createKeyPairDto: CreateKeyPairDto,
  ): Promise<KeyPairResponseDto> {
    try {
      return await this.authService.createKeyPair(createKeyPairDto.apikey);
    } catch (error) {
      handleException(error, {
        unauthorized:
          'Fallo en la creación del par de claves. Verifique su API key.',
        badRequest: 'Solicitud inválida. Verifique los parámetros enviados.',
      });
    }
  }
}
