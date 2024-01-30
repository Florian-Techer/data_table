import React, { useEffect, useRef, useState, useCallback } from "react";
import $ from "jquery";
import "datatables.net";
import "datatables.net-dt/css/jquery.dataTables.css";
// import "bootstrap/dist/css/bootstrap.min.css";
import { Form } from "react-bootstrap"; //
import ReactDOMServer from "react-dom/server";
import "./datatable.css"

export const Datatable = ({ item }) => {
  const datatableRef = useRef(null);
  let selectedIds = [];
  const [selectedIdsLenght, setSelectedIdsLenght] = useState(0);
  const [ids, setIds] = useState([]);
  let idsRef = useRef([]);

  // Function to delete item by id
  const deleteItemById = async (id) => {
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_PATH}/${item}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "DELETE", id: id }),
      });
    } catch (error) {
      console.log(error);
    }
  };

  // Function to export the visible row of the datatable
  const exportToCSV = () => {
    const fileName = "export_datatable";
    const table = $(datatableRef.current).DataTable();
    let data = table.rows().data().toArray();
    const columns = table.columns().header().toArray();
    // Convertir les données en format CSV
    let csvContent = "data:text/csv;charset=utf-8,";

    data = data.map((element) => {
      return Object.values(element);
    });

    const updatedData = data.map((subArray) => {
      return subArray.map((item) => {
        return item === 0 ? "faux" : item === 1 ? "vrai" : item;
      });
    });

    // Supprimer les lignes où le dernier élément est un 0
    const filteredData = updatedData.filter(
      (row) => row[row.length - 1] !== "faux"
    );

    const columnName = columns.map((element) => {
      return element.textContent;
    });

    const columnsWithoutFirstAndLast = columnName.slice(
      1,
      columnName.length - 1
    );

    csvContent += columnsWithoutFirstAndLast.join(",") + "\n";

    for (let i = 0; i < filteredData.length; i++) {
      // Encadrer chaque élément par des guillemets pour gérer les valeurs contenant des virgules
      const row = filteredData[i].map((item) => `"${item}"`).join(",");
      csvContent += row + "\n";
    }

    // Créer un lien de téléchargement
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();

    // Nettoyer les ressources
    document.body.removeChild(link);
  };

  //Funtion to update the selected items list
  const updateSelectedItem = async (id) => {
    const exist = selectedIds.find((element) => element === id);

    if (!exist) {
      selectedIds = [...selectedIds, id];
    } else if (exist) {
      const newArray = selectedIds.filter((element) => element !== id);
      selectedIds = newArray;
    }
    await setSelectedIdsLenght(selectedIds.length);
    await setIds(selectedIds);
    idsRef.current = selectedIds;
  };

  //Funtion to delete the selection of items
  const handleDelete = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_PATH}/${item}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "MULTI_DELETE", ids: ids }),
      });
    } catch (error) {
      console.log(error);
    }

    // Rechargez la DataTable après la suppression
    reloadDataTable();
  };

  //Funtion to active the selection of items
  const toggleMultiActivation = async () => {
    const table = $(datatableRef.current).DataTable();
    let data = table.rows().data().toArray();
    const result = [];
    console.log(ids);
    // Parcourir chaque ID dans le tableau ids
    for (const id of ids) {
      // Rechercher l'objet dans le tableau data ayant l'ID correspondant
      const foundData = data.find((item) => item.id === id && !item.is_active);
      // Si l'objet est trouvé, créer un nouvel objet obj avec id et value
      if (foundData) {
        const obj = {
          id: foundData.id,
          is_active: !foundData.is_active && 1,
        };
        result.push(obj);
      }
    }

    console.log(result);

    if (result.length > 0) {
      try {
        await fetch(`${process.env.REACT_APP_API_BASE_PATH}/${item}/action`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "MULTI_UPDATE",
            updateMultiActivation: result,
          }),
        });
      } catch (error) {
        console.log(error);
      }
    } else {
      alert("les taches selectionné sont deja active");
    }

    // Rechargez la DataTable après la suppression
    reloadDataTable();
  };

  const updateItem = async (id, attribute, value) => {
    const newData = {
      [attribute]: value,
    };
    try {
      await fetch(`${process.env.REACT_APP_API_BASE_PATH}/${item}/action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "UPDATE", id: id, data: newData }),
      });
    } catch (error) {
      console.log(error);
    }
  };

  const reloadDataTable = useCallback(() => {
    const dataTable = $(datatableRef.current).DataTable();
    dataTable.ajax.reload();
  }, []);

  const checkAllBoxes = (checkboxesIds) => {
    selectedIds = checkboxesIds.map((str) => parseInt(str, 10));
    setIds(selectedIds);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let noSearchableColumnsIndexes = [];
        const response = await fetch(
          `${process.env.REACT_APP_API_BASE_PATH}/${item}/action`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              method: "GET_COLUMNS_AND_TYPE",
              entityName:
                item.charAt(0).toUpperCase() + item.slice(1) + "Entity", 
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // console.log(data);
          const dataTableColumns = [
            {
              data: "",
              title: "Sélectionner",
              render: function (data, type, row) {
                const isChecked = idsRef.current.find((item) => item === row.id)
                  ? "checked=checked"
                  : null;
                return `<input type="checkbox" class="select-checkbox" data-id="${row.id}" ${isChecked}></input>`;
              },
              searchable: false,
              orderable: false,
            },
          ];

          await data.forEach((attribute, index) => {
            const column = {
              data: attribute.name,
              title: attribute.name,
              orderable: true,
              // ... autres propriétés spécifiques à chaque colonne
            };
            // Ajoutez des propriétés spécifiques à chaque colonne en utilisant des conditions
            if (attribute.type === "boolean") {
              column.render = function (data, type, row) {
                const isChecked = row[attribute.name] === true ? "checked" : "";
                const switchComponent = (
                  <Form.Check
                    type="switch"
                    id={`switch-${row.id}`}
                    className="switch-checkbox"
                    label=""
                    checked={isChecked}
                    onChange={(e) => {}}
                  />
                );
                return ReactDOMServer.renderToString(switchComponent);
              };
              noSearchableColumnsIndexes.push(index + 1);
            }

            // Ajoutez la colonne au tableau des colonnes de la DataTable
            dataTableColumns.push(column);
          });
          const $tableTodo = $(datatableRef.current);
          let currentPage;
          const table = $tableTodo.DataTable({
            processing: true,
            serverSide: true,
            paging: true,
            lengthMenu: [5, 10, 15, 25, 50],
            language: {
              lengthMenu: "Montrer _MENU_ résultats par page",
              zeroRecords: "Aucun résultat ne correspond à votre recherche.",
              info: "Résultats _START_ à _END_ sur _TOTAL_",
              infoFiltered: "(Filtrage sur un total de _MAX_ éléments)",
              infoEmpty: "Aucun résultat",
              search: "Rechercher",
              paginate: {
                next: "Suivant",
                previous: "Précédent",
              },
            },
            // Ajax request to be sent on draw
            ajax: {
              url: `${process.env.REACT_APP_API_BASE_PATH}/${item}/datatable`,
              method: "GET",
              data: function (params) {
                params.draw = params.draw || 1;
                params.start = params.start || 0;
                params.length = params.length || 5;
                params.search = params.search.value || "";
                params.orderColumnIndex = params.order[0].column || 0;
                params.orderDirection = params.order[0].dir || "asc";
                // Handling column search inputs
                const searchableInputs = $(datatableRef.current).find(
                  ".search-row input[type='text']"
                );
                searchableInputs.each(function (index, input) {
                  const columnIndex = $(input).closest("td").index();
                  const searchValue = $(input).val();
                  params.columns[columnIndex].search.value = searchValue;
                });
                return params;
              },
            },
            columns: dataTableColumns,
            bDestroy: true,
            // Adding search row and search input for every searchable column
            initComplete: function () {
              let api = this.api();
              let columns = api.columns();
              let searchableColumnsIndexes = [...columns[0]];
              searchableColumnsIndexes.splice(0, 1);
              const filteredSearchableColumnsIndexes =
                searchableColumnsIndexes.filter(
                  (index) => !noSearchableColumnsIndexes.includes(index)
                );
              let searchRow = $(table.table().header()).next("tr.search-row");
              if (!searchRow.length) {
                searchRow = $('<tr class="search-row"></tr>').insertAfter(
                  $(table.table().header())
                );
                columns.every(function (index) {
                  let column = this;
                  let title = $(column.header()).text().trim();
                  if (filteredSearchableColumnsIndexes.includes(index)) {
                    let inputCell = $("<td></td>").appendTo(searchRow);
                    $(
                      '<input type="text" placeholder="Rechercher par ' +
                        title +
                        '" />'
                    )
                      .appendTo(inputCell)
                      .css("width", "100%")
                      .on("keyup change", function (e) {
                        if (column.search() !== this.value) {
                          column.search(this.value).draw();
                        }
                      });
                  } else {
                    $("<td></td>").appendTo(searchRow);
                  }
                });
              }

              const selectAllCheckbox = document.createElement("input");
              selectAllCheckbox.type = "checkbox";
              selectAllCheckbox.className = "select-all-checkbox";

              const label = document.createElement("label");
              label.appendChild(selectAllCheckbox);
              label.appendChild(document.createTextNode("Sélectionner tout"));

              const headerCell = $tableTodo.find("th")[0];
              headerCell.innerHTML = ""; // Nettoyer le contenu du header cell
              headerCell.appendChild(label); // Ajouter la case à cocher à la colonne de sélection

              // Gérer la sélection de toutes les cases à cocher
              $tableTodo.on(
                "change",
                ".select-all-checkbox",
                async function () {
                  let checkboxesIds = [];
                  const isChecked = $(this).prop("checked");
                  const checkboxes = $tableTodo.find(".select-checkbox");
                  if ($(this).prop("checked")) {
                    for (let i = 0; i < checkboxes.length; i++) {
                      checkboxesIds = [
                        ...checkboxesIds,
                        checkboxes[i].getAttribute("data-id"),
                      ];
                    }
                    checkAllBoxes(checkboxesIds);
                    await this.setAttribute("checked", null);
                  } else {
                    checkboxesIds = [];
                    checkAllBoxes(checkboxesIds);
                    await this.setAttribute("checked", "checked");
                  }
                  checkboxes.prop("checked", isChecked);
                  checkboxes.trigger("change");
                }
              );
              $tableTodo.addClass("table table-striped table-bordered"); // Bootstrap classes for styling
            },
            // Handling item deletion
            drawCallback: function () {
        
              // Handling page change
              table.on("page.dt", function () {
                const pageInfo = table.page.info();
                currentPage = pageInfo.page;
              });

              // Handling item select
              $(datatableRef.current)
                .find(".select-checkbox")
                .on("change", async function () {
                  const id = $(this).data("id");
                  await updateSelectedItem(id);
                });

              // Handling item activation
              $(datatableRef.current)
                .find(".switch-checkbox")
                .on("change", async function () {
                  const columnIndex = $(this).closest("td").index();
                  const headerCell = $tableTodo.find("th")[columnIndex];
                  const headerCellText = $(headerCell).text();
                  const id = parseInt(
                    $(this).children().first()[0].id.replace("switch-", "")
                  );
                  const value = $(this).children().first()[0].checked ? 1 : 0;
                  await updateItem(id, headerCellText, value);
                });
            },
          });
        } else {
          console.error("Error fetching data");
        }
      } catch (error) {
        console.error(error);
      }
    };

    // Appelez la fonction asynchrone fetchData
    fetchData();
  }, []);
  return (
    <>
      {selectedIdsLenght !== 0 && (
        <>
          <div>
            <button
              className="multi-delete-btn"
              onClick={() => handleDelete()}
            >
              Supprimer
            </button>
            <button
              className="multi-delete-btn"
              onClick={() => toggleMultiActivation()}
            >
              Activer
            </button>
          </div>
        </>
      )}
      <div
        style={{
          overflowX: "scroll",
          background: "white",
          padding: "15px",
          fontSize: "12px",
          border: "1px solid black",
        }}
      >
        <table ref={datatableRef} className="stripe"></table>
      </div>
      <div>
        <button onClick={exportToCSV}>Exporter en CSV</button>
      </div>
    </>
  );
};
