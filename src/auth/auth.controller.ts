import {
  Body,
  Controller,
  Get,
  Headers,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/in/login.dto';
import { CreateKeyPairDto } from './dto/in/create-keypair.dto';
import { LoginResponseDto } from './dto/out/login.response.dto';
import { KeyPairResponseDto } from './dto/out/key-pair.response.dto';
import { UsuarioResponseDto } from './dto/out/usuario.response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UsuarioActual } from './decorators/usuario-actual.decorator';
import { JwtPayload } from './roles.enum';
import { DatosPersonalesDto } from './dto/in/datos-personales.dto';
import { RegistroDto } from './dto/in/registro.dto';
import { ReenviarDto, VerificarDto } from './dto/in/verificar.dto';
import { VerificacionService } from './verificacion.service';
import { UsuariosService } from './usuarios.service';
import { handleException } from 'src/common/exception/error-handler';

@Controller('auth')
@ApiTags('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usuariosService: UsuariosService,
    private readonly verificacionService: VerificacionService,
  ) {}

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión con email y contraseña',
    description:
      'Devuelve un JWT que lleva la identidad y el rol del usuario. Ese token ' +
      'es el que autoriza tanto este servicio como los endpoints de griselda-backend.',
  })
  @ApiResponse({ status: 201, description: 'Login exitoso', type: LoginResponseDto })
  @ApiUnauthorizedResponse({
    description: 'Email o contraseña incorrectos, o usuario inactivo.',
  })
  @ApiBadRequestResponse({ description: 'Faltan parámetros o el email no es válido.' })
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('registro')
  @ApiOperation({
    summary: 'Crear una cuenta de estudiante desde la landing',
    description:
      'Público. El rol es siempre «estudiante»: no se acepta un rol en el ' +
      'cuerpo porque permitiría darse de alta como administrador. ' +
      'NO devuelve sesión: la cuenta queda pendiente hasta confirmar el ' +
      'código de 6 dígitos que se envía por correo.',
  })
  @ApiResponse({ status: 201, description: 'Cuenta creada; código enviado por correo.' })
  @ApiBadRequestResponse({ description: 'Datos inválidos o contraseña demasiado corta.' })
  async registro(@Body() dto: RegistroDto) {
    const usuario = await this.usuariosService.registrar(dto);
    await this.verificacionService.enviarCodigo(usuario);
    return {
      email: usuario.email,
      requiereVerificacion: true,
      message: 'Te enviamos un código de 6 dígitos para confirmar tu email.',
    };
  }

  @Post('verificar')
  @ApiOperation({
    summary: 'Confirmar el email con el código recibido',
    description:
      'Al acertar el código la cuenta queda verificada y se devuelve la sesión ' +
      'iniciada, sin pedir la contraseña otra vez.',
  })
  @ApiResponse({ status: 201, description: 'Email confirmado; sesión iniciada.', type: LoginResponseDto })
  @ApiBadRequestResponse({ description: 'Código incorrecto, caducado o agotado.' })
  async verificar(@Body() dto: VerificarDto): Promise<LoginResponseDto> {
    const usuario = await this.verificacionService.verificar(dto.email, dto.codigo);
    return this.authService.emitirSesion(usuario);
  }

  @Post('reenviar-codigo')
  @ApiOperation({
    summary: 'Reenviar el código de verificación',
    description:
      'Responde igual exista o no la cuenta: distinguirlo revelaría qué emails ' +
      'están dados de alta. Hay una espera mínima entre envíos.',
  })
  @ApiResponse({ status: 201, description: 'Si la cuenta existe y está pendiente, se envió un código.' })
  async reenviar(@Body() dto: ReenviarDto) {
    await this.verificacionService.reenviar(dto.email);
    return {
      message: 'Si esa cuenta existe y está pendiente, te enviamos un código nuevo.',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Datos del usuario del token',
    description:
      'Permite al panel comprobar al arrancar si el token guardado sigue siendo ' +
      'válido y con qué rol, sin volver a pedir credenciales.',
  })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
  async me(@UsuarioActual() actual: JwtPayload): Promise<UsuarioResponseDto> {
    // Se relee de la base: el rol pudo cambiar después de emitir el token.
    const usuario = await this.usuariosService.buscarPorId(actual.sub);
    return new UsuarioResponseDto(usuario);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('fotografia'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar los datos personales propios',
    description:
      'Cualquier usuario con sesión mantiene aquí su propio perfil. No puede ' +
      'cambiar su rol, su email ni el estado de su cuenta: eso es cosa del ' +
      'administrador, y permitirlo sería dejar que alguien se ascienda solo.',
  })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiUnauthorizedResponse({ description: 'Token ausente, inválido o expirado.' })
  async actualizarPerfil(
    @UsuarioActual() actual: JwtPayload,
    @Body() dto: DatosPersonalesDto,
    @UploadedFile() fotografia?: Express.Multer.File,
  ): Promise<UsuarioResponseDto> {
    return new UsuarioResponseDto(
      await this.usuariosService.actualizarPerfil(actual.sub, dto, fotografia),
    );
  }

  @Post('create-keypair')
  @ApiOperation({ summary: 'Crear un nuevo par de claves RSA para un API key' })
  @ApiResponse({ status: 201, type: KeyPairResponseDto })
  @ApiBadRequestResponse({ description: 'Error al generar las claves RSA.' })
  async createKeyPair(
    @Headers('x-api-key') apikey: string,
    @Body() _createKeyPairDto: CreateKeyPairDto,
  ): Promise<KeyPairResponseDto> {
    try {
      return await this.authService.createKeyPair(apikey);
    } catch (error) {
      handleException(error, {
        unauthorized: 'Fallo en la creación del par de claves. Verifique su API key.',
        badRequest: 'Solicitud inválida. Verifique los parámetros enviados.',
      });
    }
  }
}
