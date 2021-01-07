import {
    BadRequestException,
    Body,
    Controller, Get,
    HttpCode, HttpStatus, Logger, NotFoundException, Param,
    Post,
    UploadedFile, UseGuards,
    UseInterceptors
} from "@nestjs/common";
import {
    ApiBearerAuth,
    ApiBody,
    ApiConsumes,
    ApiOkResponse, ApiProperty,
    ApiResponse, ApiSecurity,
    ApiTags
} from "@nestjs/swagger";
import { UploadService } from './upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadOutputDto } from './dto/upload.output.dto';
import os from 'os';
import { UploadInputDto } from './dto/upload.input.dto';
import { CsvFileInterceptor, CsvFile } from './csv-file.interceptor';
import { HeaderMappingInputDto } from './dto/header-mapping.input.dto';
import { HeaderMappingOutputDto } from './dto/header-mapping.output.dto';
import { ObjectIdInterceptor } from '../common/object-id.interceptor';
import { JwtAuthGuard } from "../user/guards/jwt-auth.guard";

const FILE_UPLOAD_FIELD = 'file';
const FILE_TMP_DIR = os.tmpdir();

class UploadIDOutput {
    @ApiProperty()
    _id: string;
}

@Controller('uploads')
@ApiTags('Upload')
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(
        FileInterceptor(FILE_UPLOAD_FIELD, { dest: FILE_TMP_DIR }),
        CsvFileInterceptor
    )
    @ApiConsumes('multipart/form-data')
    @ApiBody({ type: UploadInputDto })
    @ApiResponse({ status: HttpStatus.OK, type: UploadIDOutput })
    @HttpCode(HttpStatus.OK)
    async upload(@UploadedFile() file: CsvFile): Promise<UploadIDOutput> {
        const tmpUploadID = await this.uploadService.create(file);
        return { _id: tmpUploadID };
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiResponse({ type: UploadOutputDto })
    async findByID(@Param('id') id: string): Promise<UploadOutputDto> {
        const upload = await this.uploadService.findByID(id);
        if (!upload) {
            throw new NotFoundException();
        }
        return new UploadOutputDto({
            _id: id,
            headers: upload.headers
        });
    }

    @Post(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiBody({ type: HeaderMappingInputDto })
    @ApiOkResponse({ type: HeaderMappingOutputDto })
    @UseInterceptors(ObjectIdInterceptor)
    async persistUpload(
        @Param('id') id: string,
        @Body() mappingData: HeaderMappingInputDto): Promise<HeaderMappingOutputDto> {

        const tmpUpload = await this.uploadService.findByID(id);
        if (!tmpUpload) {
            throw new NotFoundException();
        }

        const result = await this.uploadService.mapUpload(tmpUpload, mappingData);
        return new HeaderMappingOutputDto({
            collections: result.collections.map((c) => c.name),
            institutions: result.institutions.map((i) => i.name)
        });
    }
}
