import { Module } from '@nestjs/common';
import { CollectionService } from './collection.service';
import { CollectionController } from './collection.controller';
import { DatabaseModule } from '../database/database.module';
import { CheckInstitutionPipe } from './check-institution.pipe';
import { CommonModule } from '../common/common.module';

@Module({
    imports: [
        CommonModule,
        DatabaseModule
    ],
    providers: [
        CollectionService,
        CheckInstitutionPipe
    ],
    controllers: [CollectionController],
})
export class CollectionModule { }