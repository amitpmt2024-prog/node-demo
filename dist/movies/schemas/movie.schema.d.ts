import { Document } from 'mongoose';
export type MovieDocument = Movie & Document;
export declare class Movie {
    title: string;
    publishYear: number;
    imageURL: string;
}
export declare const MovieSchema: import("mongoose").Schema<Movie, import("mongoose").Model<Movie, any, any, any, Document<unknown, any, Movie, any, import("mongoose").DefaultSchemaOptions> & Movie & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any, Movie>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Movie, Document<unknown, {}, Movie, {
    id: string;
}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Movie & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    title?: import("mongoose").SchemaDefinitionProperty<string, Movie, Document<unknown, {}, Movie, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Movie & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    publishYear?: import("mongoose").SchemaDefinitionProperty<number, Movie, Document<unknown, {}, Movie, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Movie & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    imageURL?: import("mongoose").SchemaDefinitionProperty<string, Movie, Document<unknown, {}, Movie, {
        id: string;
    }, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & Omit<Movie & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Movie>;
