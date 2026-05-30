import useTable from '@hooks/table/useTable.jsx';

export default function Table({ data, columns, filter, filters, dataToFilter, initialSortName, onSelectionChange }) {
  const { tableRef } = useTable({ data, columns, filter, filters, dataToFilter, initialSortName, onSelectionChange });

  return (
    <div className='table-container' style={{ width: '100%', minWidth: 0 }}>
      <div ref={tableRef} style={{ width: '100%', minWidth: 0 }}></div>
    </div>
  );
}