import { useEffect, useState } from 'react';
import './korifx-loader.scss';

type Props = {
    onDone: () => void;
};

const KoriFxLoader = ({ onDone }: Props) => {
    const [progress, setProgress] = useState(0);
    const [phase, setPhase] = useState<'loading' | 'ready'>('loading');

    useEffect(() => {
        let val = 0;
        const step = () => {
            val += Math.random() * 18 + 4;
            if (val >= 100) {
                setProgress(100);
                setPhase('ready');
                setTimeout(onDone, 700);
            } else {
                setProgress(val);
                setTimeout(step, 120 + Math.random() * 120);
            }
        };
        setTimeout(step, 200);
    }, [onDone]);

    return (
        <div className='korifx-loader'>
            <div className='korifx-loader__bg-grid' />
            <div className='korifx-loader__particles'>
                {[...Array(12)].map((_, i) => (
                    <span key={i} className={`korifx-loader__particle p${i}`} />
                ))}
            </div>

            <div className={`korifx-loader__content ${phase === 'ready' ? 'korifx-loader__content--ready' : ''}`}>
                <div className='korifx-loader__logo-wrap'>
                    <div className='korifx-loader__logo-ring' />
                    <div className='korifx-loader__logo-ring korifx-loader__logo-ring--outer' />
                    <div className='korifx-loader__logo-text'>
                        <span className='korifx-loader__logo-k'>K</span>ori
                        <span className='korifx-loader__logo-fx'>Fx</span>
                    </div>
                </div>

                <p className='korifx-loader__tagline'>AI-Powered Trading Automation</p>

                <div className='korifx-loader__bar-wrap'>
                    <div
                        className='korifx-loader__bar-fill'
                        style={{ width: `${progress}%` }}
                    />
                    <div className='korifx-loader__bar-glow' style={{ left: `${progress}%` }} />
                </div>

                <p className='korifx-loader__pct'>{Math.round(progress)}%</p>

                <p className='korifx-loader__powered'>
                    powered by{' '}
                    <span className='korifx-loader__deriv'>Deriv</span>
                </p>
            </div>
        </div>
    );
};

export default KoriFxLoader;
