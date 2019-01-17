// @flow
import React from 'react';
import Table from './Table';
import isEqual from 'lodash/isEqual';
import Tableable from './Tableable';
import makeColumns, { filterAdminCols } from './makeColumns';
import CreativesTableButtons from './CreativesTableButtons';

const makeColumnDefs = (
  handleAttachCreative,
  attachedIds,
  tableRef,
  currentUser,
) => [
  handleAttachCreative && attachedIds && tableRef
    ? {
      field: '_id',
      header: '#',
      attachedIds: attachedIds || [],
      cellType: 'attach',
      fireFetchData: tableRef.fireFetchData,
      handleAttach: handleAttachCreative,
      width: 100,
    }
    : null,
  {
    header: 'Creative',
    subField: [
      {
        field: 'thumb',
        cellType: 'thumb',
      },
      {
        field: 'name',
        cellType: 'link',
        linkTo: params => `/creative/${params._original._id}`,
        filterType: 'text',
        header: 'Name',
      },
      {
        field: 'type',
        cellType: 'enum',
        filterType: 'enum',
        path: 'Creatives.types',
        placeholder: 'Any Type',
        width: 110,
      },
      {
        field: 'status',
        cellType: 'enum',
        filterType: 'enum',
        path: 'Creatives.statuses',
        placeholder: 'Any Status',
        width: 110,
      }
    ],
  },
  {
    header: 'Org',
    subField: [
      {
        field: 'org.name',
        cellType: 'link',
        linkTo: params =>
          (params && params._original && params._original.org
            ? `/org/${params._original.org._id}`
            : ''),
        filterType: 'text',
        header: 'Name',
        width: 175,
      },
    ],
  },
  {
    header: 'Dimensions',
    subField: [
      {
        field: 'width',
        filterType: 'number',
        cellType: 'number',
        width: 110,
      },
      {
        field: 'height',
        filterType: 'number',
        cellType: 'number',
        width: 110,
      },
    ],
  },
  {
    field: 'updated',
    cellType: 'age',
    width: 120,
    header: 'Age',
  },
  {
    field: '_id',
    cellType: 'text',
    filterType: 'text',
    width: 100,
  },
];


const getRowClass = params => {
  if (
    params.status === 96 ||
    params.status === 97 ||
    params.status === 98 ||
    params.status === 99
  ) {
    return 'text-danger';
  }
  return '';
};

type Props = {
  tableRef: Object,
  updateFiltered: Function,
  updateSorted: Function,
  updateAll: Function,
  currentUser: Object,
  removeFilter: Function,
  setTableRef: any,
  defaultSorted: Array<Object>,
  defaultFiltered: Array<any>,
  orgs: Array<Object>,
  parentOrg: Object,
  hideChildOrgBtn: boolean,
  ignoreDefaultFilter: boolean,
  omitColumns: Array<any>,
  attachedIds: Array<string>,
  handleAttachCreative: Function,
};

type State = {
  skipRefetch: boolean,
  tableState: Object,
};
class CreativesTable extends React.Component<Props, State> {
  constructor() {
    super();
    this.state = ({
      skipRefetch: true,
      tableState: {},
    });
  }
  componentDidUpdate(prevProps) {
    // Checks current table ref vs old tableRef if different --> Set State
    if (this.props.tableRef !== prevProps.tableRef) {
      this.setState({
        tableState: this.props.tableRef.state,
      });
    }
  }
  // Added this to stop the rerender of table after every click.
  // The above function sets the table state to component state,
  // and if that exists it does not auto rerender
  shouldComponentUpdate({ attachedIds: nextAttachedIds }) {
    if (!isEqual(nextAttachedIds, this.props.attachedIds)) return true;
    if (this.state.tableState.filterList) {
    // how dare you? Don't rerender
      return false;
    }
    // okay re-render
    return true;
  }
  render() {
    const {
      tableRef,
      updateFiltered,
      updateSorted,
      updateAll,
      currentUser,
      removeFilter,
      setTableRef,
      defaultSorted,
      defaultFiltered,
      orgs,
      parentOrg,
      hideChildOrgBtn,
      ignoreDefaultFilter,
      omitColumns = [],
      attachedIds,
      handleAttachCreative,
    } = this.props;
    const sorted = defaultSorted || [{ field: 'updated', order: 'desc' }];
    const filtered = defaultFiltered || [];
    const currentUserCols = makeColumnDefs(
      handleAttachCreative,
      attachedIds,
      tableRef,
      currentUser,
    );
    const tableButtons = () => (
      <CreativesTableButtons
        defaultFiltered={filtered}
        currentUserCols={currentUserCols}
        updateFiltered={updateFiltered}
        updateSorted={updateSorted}
        updateAll={updateAll}
        currentUser={currentUser}
        tableRef={tableRef}
        orgs={orgs}
        parentOrg={parentOrg}
        hideChildOrgBtn={hideChildOrgBtn}
        ignoreDefaultFilter={ignoreDefaultFilter}
      />
    );
    const cols = makeColumns(
      filterAdminCols(currentUser, currentUserCols, omitColumns),
      updateFiltered,
      removeFilter,
      tableRef,
    );
    return (
      <div>
        {(this.state.tableState.filterList) ? <Table
          tableButtons={tableButtons}
          setTableRef={setTableRef}
          columns={cols}
          defaultSorted={sorted}
          defaultFiltered={filtered}
          getRowClass={getRowClass}
          filterList={this.props.tableRef.state.filterList}
          freeze={this.state.skipRefetch}
          queryData={this.props.tableRef.props.queryData}
        /> :
          <Table
            tableButtons={tableButtons}
            setTableRef={setTableRef}
            columns={cols}
            getRowClass={getRowClass}
            defaultSorted={sorted}
            defaultFiltered={filtered}
            freeze={this.state.skipRefetch}
          />}
      </div>
    );
  }
}

export default Tableable(CreativesTable);
