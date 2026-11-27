
import "../css/Payroll.css";

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export default function PayrollPage({
  title = "Nóminas",
  description = "Estamos trabajando para ofrecerte una experiencia de Nóminas más sencilla y eficiente para tu clínica dental.",
}: ComingSoonProps) {
  return (
    <main className="coming-soon">
      <div className="coming-soon__container">
        <div className="coming-soon__icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 3h8l5 5v13H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M15 3v5h5" />
            <path d="M9 13h7M9 17h5" />
            <path d="M9 9h2" />
          </svg>
        </div>

        <span className="coming-soon__badge">
          <span className="coming-soon__dot" />
          En desarrollo
        </span>

        <h1>
          {title} <span>próximamente</span>
        </h1>

        <p className="coming-soon__description">
          {description}
        </p>

        <div className="coming-soon__divider" />

        <div className="coming-soon__footer">
          <span>Estamos preparando algo especial para ti.</span>
        </div>
      </div>
    </main>
  );
}
