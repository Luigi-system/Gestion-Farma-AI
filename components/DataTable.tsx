import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  title: string;
}

const DataTable = <T,>({ columns, data, title }: DataTableProps<T>): React.ReactElement => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm dark:bg-gray-800 flex flex-col">
      {title && <h3 className="text-lg font-semibold text-gray-800 mb-4 dark:text-gray-100">{title}</h3>}
      <div className="overflow-auto max-h-[70vh] rounded-lg border dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider dark:text-gray-300"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
            {data.length > 0 ? data.map((item, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-6 py-4 whitespace-normal break-words text-sm text-black dark:text-gray-100">
                    {col.render ? col.render(item) : String(item[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No hay datos para mostrar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;