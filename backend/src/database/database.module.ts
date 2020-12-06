import { Module } from '@nestjs/common';
import { DatabaseConfigService } from './database-config.service';
import { CollectionProvider } from './models/Collection';
import { InstitutionProvider } from './models/Institution';
import { TmpUploadProvider } from './models/TmpUpload';
import { UserProvider } from './models/User';
import { DatabaseProvider } from './database.provider';

@Module({
    providers: [
        DatabaseConfigService,
        DatabaseProvider,
        CollectionProvider,
        InstitutionProvider,
        TmpUploadProvider,
        UserProvider
    ],
    exports: [
        CollectionProvider,
        InstitutionProvider,
        TmpUploadProvider,
        UserProvider
    ]
})
export class DatabaseModule { }
