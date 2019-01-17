/**
 * A wrapper for ReactTable which stores the ref in state and
 * passes it back into the table
 */
import React from 'react';
import findIndex from 'lodash/findIndex';
import isEqual from 'lodash/isEqual';

export default function Tableable(Component) {
  const klass = class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        mounted: false,
        tableRef: null,
      };
      this.setTableRef = this.handleTableRef.bind(this);
      this.updateFiltered = this.updateFiltered.bind(this);
      this.removeFilter = this.removeFilter.bind(this);
      this.updateAll = this.updateAll.bind(this);
      this.updateSorted = this.updateSorted.bind(this);
    }
    componentWillMount() {
      this.setState({ mounted: true });
    }
    componentWillUnmount() {
      this.setState({ mounted: false });
    }
    // track the tableRef
    //   this is needed to have more dynamic access to the table and methods
    handleTableRef(tableRef) {
      if (!this.state.mounted) return;
      if (tableRef) this.setState({ tableRef });
    }
    updateFiltered(filtered) {
      if (this.state.tableRef) {
        if (this.state.tableRef.state.filtered) {
          const tableFilters = this.state.tableRef.state.filtered;
          const ids = filtered.map(f => f.id);
          filtered = filtered.concat(tableFilters.filter(f => !ids.includes(f.id)));
        }
        this.state.tableRef.setState({ filtered, page: 0 }, () => {
          this.state.tableRef.fireFetchData();
        });
      }
    }
    updateSorted(sorted) {
      if (this.state.tableRef) {
        if (this.state.tableRef.state.sorted) {
          const tableSorts = this.state.tableRef.state.sorted;
          const ids = sorted.map(s => s.id);
          sorted = sorted.concat(tableSorts.filter(s => !ids.includes(s.id)));
        }
        this.state.tableRef.setState({ sorted, page: 0 }, () => {
          this.state.tableRef.fireFetchData();
        });
      }
    }
    updateAll(filtered, sorted) {
      if (this.state.tableRef) {
        if (this.state.tableRef.state.filtered) {
          const tableFilters = this.state.tableRef.state.filtered;
          const ids = filtered.map(f => f.id);
          filtered = filtered.concat(tableFilters.filter(f => !ids.includes(f.id)));
        }
        if (this.state.tableRef.state.sorted) {
          const tableSorts = this.state.tableRef.state.sorted;
          const ids = sorted.map(s => s.id);
          sorted = sorted.concat(tableSorts.filter(s => !ids.includes(s.id)));
        }
        this.state.tableRef.setState({ filtered, sorted, page: 0 }, () => {
          this.state.tableRef.fireFetchData();
        });
      }
    }
    removeFilter(filterIndex, filter) {
      if (filter.operator === undefined) {
        filter.operator = '$eq';
      }
      if (this.state.tableRef && this.state.tableRef.state && this.state.tableRef.state.filtered) {
        const tableFilters = this.state.tableRef.state.filtered;
        tableFilters.forEach(f => (f.operator = f.operator || '$eq'));
        const index = filterIndex || findIndex(tableFilters, o => isEqual(o, filter));
        if (index !== -1) {
          this.state.tableRef.setState(
            prevState => {
              const filters = prevState.filtered;
              filters.splice(index, 1);
              return { filters };
            },
            () => {
              this.state.tableRef.fireFetchData();
            },
          );
        }
      }
    }
    render() {
      return (
        <Component
          {...this.props}
          tableRef={this.state.tableRef}
          setTableRef={this.setTableRef}
          updateSorted={this.updateSorted}
          updateFiltered={this.updateFiltered}
          removeFilter={this.removeFilter}
          updateAll={this.updateAll}
        />
      );
    }
  };
  klass.displayName = `Tableable(${Component.name})`;
  return klass;
}
