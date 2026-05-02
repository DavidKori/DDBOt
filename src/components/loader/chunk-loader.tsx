import './chunk-loader.scss';

export default function ChunkLoader({ message }: { message: string }) {
    return (
        <div className='app-root'>
            <div className='chunk-loader'>
                <div className='chunk-loader__dot' />
                <div className='chunk-loader__dot' />
                <div className='chunk-loader__dot' />
            </div>
            {message && <div className='load-message'>{message}</div>}
        </div>
    );
}
