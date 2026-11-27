
import { Banknote, TrendingUp } from "lucide-react";

interface Props {
  sales: number;
}

const DashboardSalesCard = ({ sales }: Props) => {
  const formattedSales = (sales ?? 0).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
  });

  return (
    <article className="dashboard-sales-card">
      <div className="dashboard-sales-card__header">
        <div>
          <span>Ingresos del periodo</span>
          <p>Ingresos registrados según el filtro seleccionado</p>
        </div>

        <div className="dashboard-sales-card__icon">
          <Banknote size={23} />
        </div>
      </div>

      <strong>{formattedSales}</strong>

      <div className="dashboard-sales-card__footer">
        <TrendingUp size={15} />
        <span>Ingresos del periodo seleccionado</span>
      </div>
    </article>
  );
};

export default DashboardSalesCard;
