import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { Role } from '@prisma/client';
import { ALL_ADMIN_PERMISSIONS } from '../../common/permissions/admin-permissions';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: Role, required: false })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  area?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  password?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  points?: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsString({ each: true })
  @IsIn(ALL_ADMIN_PERMISSIONS, { each: true })
  adminPermissions?: string[];
}
