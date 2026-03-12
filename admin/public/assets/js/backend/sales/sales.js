define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'sales/sales/index',
                    edit_url: 'sales/sales/edit',
                    table: 'sales',
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
                        {field: 'name', title: __('Name'), operate: 'LIKE'},
                        {field: 'phone', title: __('Phone'), operate: 'LIKE'},
                        // 根据 company_id + 全局 companyMap 显示所属公司名称
                        {
                            field: 'company_id',
                            title: __('Company'),
                            operate: '=',
                            formatter: function (value, row, index) {
                                if (typeof window.companyMap === 'object' && window.companyMap) {
                                    if (value && window.companyMap[value]) {
                                        return window.companyMap[value];
                                    }
                                }
                                return '-';
                            }
                        },
                        {field: 'ongoing_orders', title: __('Ongoing orders'), sortable: true, operate: 'BETWEEN'},
                        {
                            field: 'is_admin',
                            title: __('Is admin'),
                            searchList: {1: __('Yes'), 0: __('No')},
                            formatter: function (value, row, index) {
                                var text = value ? __('Yes') : __('No');
                                var cls = value ? 'label label-success' : 'label label-default';
                                return '<span class="' + cls + '">' + text + '</span>';
                            }
                        },
                        {field: 'updatetime', title: __('Updatetime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
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
