define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'points/exchange/index',
                    edit_url: 'points/exchange/edit',
                    table: 'exchange_records',
                }
            });

            var table = $("#table");

            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'userId', title: __('User id'), operate: 'BETWEEN'},
                        {field: 'itemId', title: __('Item id'), operate: 'BETWEEN'},
                        {field: 'quantity', title: __('Quantity'), operate: 'BETWEEN'},
                        {field: 'pointsSpent', title: __('Points spent'), operate: 'BETWEEN'},
                        {
                            field: 'kind',
                            title: __('Kind'),
                            searchList: {physical: __('Physical'), virtual: __('Virtual')},
                            formatter: Table.api.formatter.normal
                        },
                        {
                            field: 'status',
                            title: __('Status'),
                            searchList: {
                                pending_shipment: __('Pending shipment'),
                                shipped: __('Shipped'),
                                received: __('Received'),
                                completed: __('Completed')
                            },
                            formatter: Table.api.formatter.status
                        },
                        {field: 'createdAt', title: __('Createdat'), operate: 'RANGE', addclass: 'datetimerange'},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: Table.api.formatter.operate}
                    ]
                ]
            });

            Table.api.bindevent(table);
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            }
        }
    };
    return Controller;
});

