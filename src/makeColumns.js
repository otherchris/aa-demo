// @flow
import React from 'react';
import capitalize from 'lodash/capitalize';
import each from 'lodash/each';
import has from 'lodash/has';
import remove from 'lodash/remove';
import cloneDeep from 'lodash/cloneDeep';
import Dropdown from '../components/filter/Dropdown';
import TableLink from '../components/cell/TableLink';
import Text from '../components/cell/Text';
import Enum from '../components/cell/Enum';
import Thumb from '../components/cell/Thumb';
import Age from '../components/cell/Age';
import Date from '../components/cell/Date';
import Days from '../components/cell/Days';
import Count from '../components/cell/Count';
import Cost from '../components/cell/Cost';
import Percentage from '../components/cell/Percentage';
import ProgressBar from '../components/cell/ProgressBar';
import AttachBtn from '../components/cell/AttachBtn';
import TextFilter from '../components/filter/Text';
import BoolFilter from '../components/filter/Bool';
import NumberFilter from '../components/filter/Number';
import EnumFilter from '../components/filter/Enum';
import DateFilter from '../components/filter/Date';
import { flattenReactTableColDef } from '../lib/helpers';
import { isAdmin } from '../../../api/Users/helpers.simple';

const setFilterRenderer = (col, updateFiltered, cols, removeFilter, tableRef, parentCols) => {
  let filterRenderer = null;

  switch (col.filterType) {
  case 'text':
    filterRenderer = function FilterRenderer(row) {
      return (
        <Dropdown
          row={row}
          updateFiltered={updateFiltered}
          removeFilter={removeFilter}
          cols={cols}
          tableRef={tableRef}
          parentCols={parentCols}
          FilterComponent={TextFilter}
          col={col}
          operator={'$regex-i'}
        />
      );
    };
    break;
  case 'number':
    filterRenderer = function FilterRenderer(row) {
      return (
        <Dropdown
          row={row}
          updateFiltered={updateFiltered}
          removeFilter={removeFilter}
          cols={cols}
          tableRef={tableRef}
          parentCols={parentCols}
          FilterComponent={NumberFilter}
          col={col}
        />
      );
    };
    break;
  case 'date':
    filterRenderer = function FilterRenderer(row) {
      return (
        <Dropdown
          row={row}
          updateFiltered={updateFiltered}
          removeFilter={removeFilter}
          cols={cols}
          tableRef={tableRef}
          parentCols={parentCols}
          FilterComponent={DateFilter}
          col={col}
        />
      );
    };
    break;
  case 'bool':
    filterRenderer = function FilterRenderer(row) {
      return (
        <Dropdown
          row={row}
          updateFiltered={updateFiltered}
          removeFilter={removeFilter}
          cols={cols}
          tableRef={tableRef}
          parentCols={parentCols}
          FilterComponent={BoolFilter}
          col={col}
        />
      );
    };
    break;
  case 'enum':
    filterRenderer = function FilterRenderer(row) {
      return (
        <Dropdown
          row={row}
          updateFiltered={updateFiltered}
          removeFilter={removeFilter}
          cols={cols}
          tableRef={tableRef}
          parentCols={parentCols}
          FilterComponent={EnumFilter}
          col={col}
        />
      );
    };
    break;
  case 'custom':
    ({ filterRenderer } = col);
    break;
  default:
  }

  return filterRenderer;
};

const setCellRenderer = col => {
  let cellRenderer = null;

  switch (col.cellType) {
  case 'link':
    cellRenderer = function CellRenderer(row) {
      return <TableLink row={row} col={col} />;
    };
    break;
  case 'count':
    cellRenderer = function CellRenderer(row) {
      return <Count row={row} />;
    };
    break;
  case 'cost':
    cellRenderer = function CellRenderer(row) {
      return <Cost row={row} />;
    };
    break;
  case 'days':
    cellRenderer = function CellRenderer(row) {
      return <Days row={row} />;
    };
    break;
  case 'date':
    cellRenderer = function CellRenderer(row) {
      return <Date row={row} col={col} />;
    };
    break;
  case 'progress':
    cellRenderer = function CellRenderer(row) {
      return <ProgressBar row={row} col={col} />;
    };
    break;
  case 'percentage':
    cellRenderer = function CellRenderer(row) {
      return <Percentage row={row} col={col} />;
    };
    break;
  case 'enum':
    cellRenderer = function CellRenderer(row) {
      return <Enum row={row} col={col} />;
    };
    break;
  case 'thumb':
    cellRenderer = function CellRenderer(row) {
      return <Thumb row={row} col={col} />;
    };
    break;
  case 'age':
    cellRenderer = function CellRenderer(row) {
      return <Age row={row} col={col} />;
    };
    break;
  case 'attach':
    cellRenderer = function CellRenderer(row) {
      return <AttachBtn row={row} col={col} />;
    };
    break;
  case 'custom':
    ({ cellRenderer } = col);
    break;
  default:
    cellRenderer = function CellRenderer(row) {
      return <Text row={row} col={col} />;
    };
  }

  return cellRenderer;
};

const setFilterable = col => {
  if (col.filterable) return col.filterable;
  if (!col.filterType) return false;
  return true;
};

const needsSubCols = col => Array.isArray(col.subField) && col.subField.length >= 1;

export const filterAdminCols = (
  currentUser: Object,
  columns: Array<any>,
  omitColumns: Array<any>,
) => {
  // clone so that the passed in columns don't get mutated
  const cols: Array<any> = cloneDeep(columns);

  // remove any null columns
  remove(cols, col => col === null);
  each(cols, col => {
    if (has(col, 'subField')) {
      remove(col.subField, subCol => subCol === null);
    }
  });

  // remove omitColumns regardless of user
  each(omitColumns, o => {
    remove(cols, col => col.field === o);
  });
  each(cols, col => {
    if (has(col, 'subField')) {
      each(omitColumns, o => {
        remove(col.subField, subCol => subCol.field === o);
      });
    }
  });

  // go ahead and return if user is an admin,
  // so that the admin only columns don't get removed
  if (isAdmin(currentUser)) {
    return cols;
  }

  // If NOT admin
  remove(cols, col => col.adminOnly === true);
  each(cols, col => {
    if (has(col, 'subField')) {
      remove(col.subField, subCol => subCol.adminOnly === true);
    }
  });

  return cols;
};

// This mutates the passed in cols
// to prevent needing to unflatten the cols
const addOpen = (cols) => {
  const flat = flattenReactTableColDef(cols);
  for (let i = 0; i < flat.length; i += 1) {
    flat[i].open = ((flat.length / 2) > i) ? 'left' : 'right';
  }
};

const makeReactTableColumns: Function =
(
  cols: Array<any>,
  updateFiltered: Function,
  removeFilter: Function,
  tableRef: Object,
  parentCols?: Array<any>,
) =>
  cols.map((col: Object) => ({
    Header:
      (col.header &&
        col.header.split(/\s+/).map(word => capitalize(word)).join(' ')) ||
        (needsSubCols(col) ? capitalize(col.field) : capitalize(col.field.split('.').pop())),
    accessor: col.accessor || (needsSubCols(col) ? null : col.field),
    Filter: setFilterRenderer(col, updateFiltered, cols, removeFilter, tableRef, parentCols),
    Cell: setCellRenderer(col),
    width: col.width,
    filterable: setFilterable(col),
    sortable: col.sortable,
    minWidth: col.minWidth || 200,
    columns: needsSubCols(col)
      ? makeReactTableColumns(col.subField, updateFiltered, removeFilter, tableRef, cols)
      : null,
  }));

const makeColumns = (
  cols: Array<any>,
  updateFiltered: Function, removeFilter: Function, tableRef: Object,
) => {
  const rtCols: Array<any> = makeReactTableColumns(cols, updateFiltered, removeFilter, tableRef);
  addOpen(rtCols);
  return rtCols;
};

export default makeColumns;
