import type { ComponentType } from 'react';
import ButtonsPage from './ButtonsPage';
import ColorsPage from './ColorsPage';
import DashboardPage from './DashboardPage';
import FormsPage from './FormsPage';
import GridPage from './GridPage';
import ModalsPage from './ModalsPage';
import PanelsPage from './PanelsPage';
import SpinnerPage from './SpinnerPage';
import TablesPage from './TablesPage';
import TabsPage from './TabsPage';
import TypePage from './TypePage';

export { default as DsIndexPage } from './DsIndexPage';

export const dsPages: Record<string, ComponentType> = {
  grid: GridPage,
  panels: PanelsPage,
  colors: ColorsPage,
  type: TypePage,
  tabs: TabsPage,
  forms: FormsPage,
  buttons: ButtonsPage,
  tables: TablesPage,
  modals: ModalsPage,
  spinner: SpinnerPage,
  dashboard: DashboardPage,
};
