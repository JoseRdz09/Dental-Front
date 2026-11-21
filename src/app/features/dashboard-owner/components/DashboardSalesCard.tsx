
import { Banknote, TrendingUp } from "lucide-react";

interface Props {
  sales: number;
}

const DashboardSalesCard = ({ sales }: Props) => {
  return (
    <article className="dashboard-sales-card">
      <div className="dashboard-sales-card__header">
        <div>
          <span>Venta del día</span>
          <p>Ingresos registrados hoy</p>
        </div>

        <div className="dashboard-sales-card__icon">
          <Banknote size={23} />
        </div>
      </div>

      <strong>
        {sales.toLocaleString("es-MX", {
          style: "currency",
          currency: "MXN",
        })}
      </strong>

      <div className="dashboard-sales-card__footer">
        <TrendingUp size={15} />
        <span>Ventas del día</span>
      </div>
    </article>
  );
};

export default DashboardSalesCard;
