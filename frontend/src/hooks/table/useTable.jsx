import { useEffect, useRef, useState } from 'react';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import "tabulator-tables/dist/css/tabulator.min.css";
import '@styles/table.css';

function useTable({ data, columns, filter, filters, dataToFilter, initialSortName, onSelectionChange }) {
    const tableRef = useRef(null);
    const [table, setTable] = useState(null);
    const [isTableBuilt, setIsTableBuilt] = useState(false);

    useEffect(() => {
        if (tableRef.current) {
            tableRef.current.style.width = '100%';
            tableRef.current.style.minWidth = '0';

            const updatedColumns = [
                { 
                    formatter: "rowSelection", 
                    titleFormatter: false, 
                    hozAlign: "center", 
                    headerSort: false, 
                    width: 48,
                    minWidth: 48,
                    maxWidth: 48,
                    cellClick: function (e, cell) {
                        cell.getRow().toggleSelect();
                    } 
                },
                ...columns
            ];
            const tabulatorTable = new Tabulator(tableRef.current, {
                data: [],
                columns: updatedColumns,
                layout: "fitColumns",
                responsiveLayout: "collapse",
                width: "100%",
                pagination: true,
                paginationSize: 6,
                selectableRows: "highlight",
                rowHeight: 46,
                langs: {
                    "default": {
                        "pagination": {
                            "first": "Primero",
                            "prev": "Anterior",
                            "next": "Siguiente",
                            "last": "Último",
                        }
                    }
                },
                initialSort: [
                    { column: initialSortName, dir: "asc" }
                ],
            });
            tabulatorTable.on("rowSelectionChanged", function(selectedData) {
                if (onSelectionChange) {
                    onSelectionChange(selectedData);
                }
            });
            tabulatorTable.on("tableBuilt", function() {
                setIsTableBuilt(true);
            });
            setTable(tabulatorTable);
            return () => {
                tabulatorTable.destroy();
                setIsTableBuilt(false);
                setTable(null);
            };
        }
    }, []);

    useEffect(() => {
        if (table && isTableBuilt) {
            table.replaceData(data);
        }
    }, [data, table, isTableBuilt]);

    useEffect(() => {
        if (table && isTableBuilt) {
            const hasAdvancedFilters = filters?.enabled && Object.entries(filters).some(([key, value]) => key !== 'enabled' && String(value || '').trim() !== '');

            if (hasAdvancedFilters) {
                const normalize = (value) => String(value ?? '').trim().toLowerCase();
                const matchesText = (value, query) => normalize(value).includes(normalize(query));
                const matchesSelect = (value, expected) => !normalize(expected) || normalize(value) === normalize(expected);
                const parseDate = (value) => {
                    if (!value) return null;
                    const parsed = new Date(value);
                    return Number.isNaN(parsed.getTime()) ? null : parsed;
                };

                table.setFilter((rowData) => {
                    const nameQuery = filters.nombreCompleto;
                    const rutQuery = filters.rut;
                    const rolQuery = filters.rol;
                    const estadoQuery = filters.estadoVerificacion;
                    const createdFrom = filters.fechaDesde ? new Date(`${filters.fechaDesde}T00:00:00`) : null;
                    const createdTo = filters.fechaHasta ? new Date(`${filters.fechaHasta}T23:59:59.999`) : null;
                    const rowDate = parseDate(rowData.createdAtRaw || rowData.createdAt);

                    const matchesName = !normalize(nameQuery) || matchesText(rowData.nombreCompleto, nameQuery);
                    const matchesRut = !normalize(rutQuery) || matchesText(rowData.rut, rutQuery);
                    const matchesRol = matchesSelect(rowData.rol, rolQuery);
                    const matchesEstado = matchesSelect(rowData.estadoVerificacion, estadoQuery);
                    const matchesFrom = !createdFrom || (rowDate ? rowDate >= createdFrom : false);
                    const matchesTo = !createdTo || (rowDate ? rowDate <= createdTo : false);

                    return matchesName && matchesRut && matchesRol && matchesEstado && matchesFrom && matchesTo;
                });
            } else if (filter) {
                table.setFilter(dataToFilter, "like", filter);
            } else {
                table.clearFilter();
            }
            table.redraw();
        }
    }, [filter, filters, table, dataToFilter, isTableBuilt]);

    return { tableRef };
}
export default useTable;