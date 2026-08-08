import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateStoreDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) name?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) address?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) area?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) phone?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(30) whatsapp?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) logo?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) coverImage?: string;
  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) images?: string[];
  @ApiPropertyOptional() @IsOptional() @IsLatitude() lat?: number;
  @ApiPropertyOptional() @IsOptional() @IsLongitude() lng?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) locationUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) facebook?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) instagram?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) tiktok?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) workingHours?: string;
}
