import logoImg from '../../assets/logo.png';

export const Logo = ({ 
  size = 'md', 
  className = '', 
  showText = false, 
  textDark = false,
  subtitle = 'Toko Bangunan'
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const imageSizeClass = sizeMap[size] || (typeof size === 'number' ? `w-[${size}px] h-[${size}px]` : 'w-10 h-10');

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative ${imageSizeClass} shrink-0 rounded-full overflow-hidden shadow-sm bg-white border border-slate-100 flex items-center justify-center`}>
        <img
          src={logoImg}
          alt="Logo TB. Sumber Agung"
          referrerPolicy="no-referrer"
          className="w-full h-full object-contain object-center scale-105"
        />
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`font-black text-sm tracking-tight leading-tight ${textDark ? 'text-slate-900' : 'text-white'}`}>
            TB. SUMBER AGUNG
          </span>
          {subtitle && (
            <span className={`text-[10px] font-semibold tracking-wider uppercase ${textDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;
