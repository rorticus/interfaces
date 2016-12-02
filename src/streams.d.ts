import Promise from 'dojo-shim/Promise';
import { Readable } from 'stream';

export type NodeSourceType = Buffer | string;

/**
 * The Source interface defines the methods a module can implement to create a source for a {@link ReadableStream}.
 *
 * The Stream API provides a consistent stream API while {@link ReadableStream.Source} and {@link WritableStream.Sink}
 * implementations provide the logic to connect a stream to specific data sources & sinks.
 */
export interface Source<T> {

	/**
	 * Tells the source to prepare for providing chunks to the stream.  While the source may enqueue chunks at this
	 * point, it is not required.
	 *
	 * @param controller The source can use the controller to enqueue chunks, close the stream or report an error.
	 * @returns A promise that resolves when the source's start operation has finished.  If the promise rejects,
	 *        the stream will be errored.
	 */
	start?(controller: ReadableStreamController<T>): Promise<void>;

	/**
	 * Requests that source enqueue chunks.  Use the controller to close the stream when no more chunks can
	 * be provided.
	 *
	 * @param controller The source can use the controller to enqueue chunks, close the stream or report an error.
	 * @returns A promise that resolves when the source's pull operation has finished.  If the promise rejects,
	 *        the stream will be errored.
	 */
	pull?(controller: ReadableStreamController<T>): Promise<void>;

	/**
	 * Optional method implemented by seekable sources to set the seek position. Use the controller to report an error.
	 * @param controller The source can use the controller to report an error.
	 * @param position The position in the stream to seek to.
	 * @returns A promise that resolves to the new seek position when the source's seek operation has finished.  If the
	 *    promise rejects, the stream will be errored.
	 */
	seek?(controller: ReadableStreamController<T>, position: number): Promise<number>;

	/**
	 * Indicates the stream is prematurely closing and allows the source to do any necessary clean up.
	 *
	 * @param reason The reason why the stream is closing.
	 * @returns A promise that resolves when the source's pull operation has finished.  If the promise rejects,
	 *        the stream will be errored.
	 */
	cancel?(reason?: any): Promise<void>;
}

export interface Strategy<T> {
	/**
	 * Computes the number of items in a chunk.
	 */
	readonly size?: (chunk: T | undefined | null) => number;

	/**
	 * The number of chunks allowed in the queue before backpressure is applied.
	 */
	highWaterMark?: number;
}

export declare class ReadableNodeStreamSource {
	constructor(nodeStream: Readable);

	cancel(reason?: any): Promise<void>;

	pull(controller: ReadableStreamController<NodeSourceType>): Promise<void>;

	start(controller: ReadableStreamController<NodeSourceType>): Promise<void>;
}

export declare class WritableNodeStreamSink {
	constructor(nodeStream: NodeJS.WritableStream, encoding?: string);

	abort(reason: any): Promise<void>;

	close(): Promise<void>;

	start(): Promise<void>;

	write(chunk: string): Promise<void>;
}

export interface ReadableStreamController<T> {
	readonly desiredSize: number;
	close(): void;
	enqueue(chunk: T): void;
	error(error: Error): void;
}

/**
 * The Sink interface defines the methods a module can implement to create a target sink for a `WritableStream`.
 *
 * The Stream API provides a consistent stream API while `ReadableStream.Source` and `WritableStream.Sink` implementors
 * provide the logic to connect a stream to specific data sources & sinks.
 */
export interface Sink<T> {

	/**
	 * Indicates the stream is prematurely closing due to an error.  The sink should do any necessary cleanup
	 * and release resources. When a stream calls `abort` it will discard any queued chunks. If the sink does not
	 * provide an `abort` method then the stream will call `close` instead.
	 *
	 * @param reason The reason the stream is closing.
	 */
	abort?(reason?: any): Promise<void>;

	/**
	 * Indicates the stream is closing.  The sink should do any necessary cleanup and release resources. The stream
	 * will not call this method until is has successfully written all queued chunks.
	 */
	close?(): Promise<void>;

	/**
	 * Requests the sink to prepare for receiving chunks.
	 *
	 * @param error An error callback that can be used at any time by the sink to indicate an error has occurred.
	 * @returns A promise that resolves when the sink's start operation has finished.  If the promise rejects,
	 *        the stream will be errored.
	 */
	start?(error: (error: Error) => void): Promise<void>;

	/**
	 * Requests the sink write a chunk.
	 *
	 * @param chunk The chunk to be written.
	 * @returns A promise that resolves when the sink's write operation has finished.  If the promise rejects,
	 *        the stream will be errored.
	 */
	write?(chunk: T): Promise<void>;
}

/**
 * Options used when piping a readable stream to a writable stream.
 */
export interface PipeOptions {
	/**
	 * Prevents the writable stream from erroring if the readable stream encounters an error.
	 */
	preventAbort?: boolean;

	/**
	 *  Prevents the readable stream from erroring if the writable stream encounters an error.
	 */
	preventCancel?: boolean;

	/**
	 * Prevents the writable stream from closing when the pipe operation completes.
	 */
	preventClose?: boolean;
}

export interface ReadResult<T> {
	value: T | undefined;
	done: boolean;
}

export interface ReadableStreamReader<T> {
	readonly closed: Promise<void>;
	cancel(reason: string): Promise<void>;
	read(): Promise<ReadResult<T>>;
	releaseLock(): void;
	release(): void;
	resolveReadRequest(chunk: T): boolean;
}

export declare class WritableStream<T> {
	readonly closed: Promise<void>;
	readonly ready: Promise<void>;

	constructor(underlyingSink?: Sink<T>, strategy?: Strategy<T>);

	abort(reason: any): Promise<void>;

	close(): Promise<void>;

	write(chunk: T): Promise<void>;
}

export interface TransformStream<R, W> {
	readonly readable: ReadableStream<R>;
	readonly writable: WritableStream<W>;
}

export declare class ReadableStream<T> {
	readonly desiredSize: number;
	readonly hasSource: boolean;
	readonly locked: boolean;
	readonly readable: boolean;
	readonly started: Promise<void>;
	readonly queueSize: number;

	constructor(underlyingSource: Source<T>, strategy?: Strategy<T>);

	cancel(reason?: any): Promise<void>;

	close(): void;

	enqueue(chunk: T): void;

	error(error: Error): void;

	getReader(): ReadableStreamReader<T>;

	pipeThrough(transformStream: TransformStream<T, any>, options?: PipeOptions): ReadableStream<T>;

	pipeTo(dest: WritableStream<T>, options?: PipeOptions): Promise<void>;

	pull(): void;

	requestClose(): void;

	tee(): [ ReadableStream<T>, ReadableStream<T> ];
}
