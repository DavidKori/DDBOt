import './korifx-header.scss';

const AFFILIATE_URL = 'https://track.deriv.com/_EOT66RdgchlMjdsyM5hasGNd7ZgqdRLk/1/';

const TelegramIcon = () => (
    <svg viewBox='0 0 24 24' fill='currentColor' width='18' height='18'>
        <path d='M11.944 0A12 12 0 1 0 24 12 12.017 12.017 0 0 0 11.944 0Zm5.813 8.21-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.87 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.941Z'/>
    </svg>
);

const WhatsAppIcon = () => (
    <svg viewBox='0 0 24 24' fill='currentColor' width='18' height='18'>
        <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378L.306 21.418l1.395-5.089a9.936 9.936 0 0 1-1.329-4.964C.372 5.995 5.375 1 11.544 1a9.939 9.939 0 0 1 7.048 2.925A9.849 9.849 0 0 1 21.5 11.016c0 5.502-4.97 9.987-11.449 9.987'/>
    </svg>
);

const YouTubeIcon = () => (
    <svg viewBox='0 0 24 24' fill='currentColor' width='18' height='18'>
        <path d='M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z'/>
    </svg>
);

const KoriFxHeader = () => {
    const isLoggedIn = !!localStorage.getItem('authToken') || document.cookie.includes('logged_state=true');
    const hasAccounts = Object.keys(JSON.parse(localStorage.getItem('accountsList') ?? '{}')).length > 0;
    const isNewUser = !isLoggedIn && !hasAccounts;

    return (
        <div className='korifx-header'>
            <div className='korifx-header__left'>
                <div className='korifx-header__brand'>
                    <span className='korifx-header__brand-k'>K</span>ori
                    <span className='korifx-header__brand-fx'>Fx</span>
                </div>
                <span className='korifx-header__powered'>powered by Deriv</span>
            </div>

            <div className='korifx-header__right'>
                <a
                    className='korifx-header__social korifx-header__social--telegram'
                    href='https://t.me/+KxePNFcYuXs4OWM0'
                    target='_blank'
                    rel='noopener noreferrer'
                    title='Telegram'
                >
                    <TelegramIcon />
                </a>
                <a
                    className='korifx-header__social korifx-header__social--whatsapp'
                    href='https://whatsapp.com/channel/0029Vb8AVrb2f3EOglunci0X'
                    target='_blank'
                    rel='noopener noreferrer'
                    title='WhatsApp Channel'
                >
                    <WhatsAppIcon />
                </a>
                <a
                    className='korifx-header__social korifx-header__social--youtube'
                    href='https://youtube.com/@korifx-1?si=cTYJgEKMhGmUfm_B'
                    target='_blank'
                    rel='noopener noreferrer'
                    title='YouTube'
                >
                    <YouTubeIcon />
                </a>

                {isNewUser && (
                    <a
                        className='korifx-header__signup'
                        href={AFFILIATE_URL}
                        target='_blank'
                        rel='noopener noreferrer'
                    >
                        Sign Up Free →
                    </a>
                )}
            </div>
        </div>
    );
};

export default KoriFxHeader;
