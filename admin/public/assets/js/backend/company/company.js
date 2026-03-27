define(['jquery', 'bootstrap', 'backend', 'table', 'form'], function ($, undefined, Backend, Table, Form) {

    var Controller = {
        index: function () {
            Table.api.init({
                extend: {
                    index_url: 'company/company/index',
                    add_url: 'company/company/add',
                    edit_url: 'company/company/edit',
                    del_url: 'company/company/del',
                    multi_url: 'company/company/multi',
                    table: 'company',
                }
            });

            var table = $("#table");

            var operateFormatter = function (value, row, index) {
                var html = Table.api.formatter.operate.call(this, value, row, index);
                if (row.status === 'pending') {
                    html += ' <a href="javascript:;" class="btn btn-success btn-xs btn-approve" data-id="' + row.id + '" title="审核通过"><i class="fa fa-check"></i> 通过</a>';
                    html += ' <a href="javascript:;" class="btn btn-danger btn-xs btn-reject" data-id="' + row.id + '" title="审核驳回"><i class="fa fa-times"></i> 驳回</a>';
                }
                return html;
            };

            table.bootstrapTable({
                url: $.fn.bootstrapTable.defaults.extend.index_url,
                pk: 'id',
                sortName: 'id',
                columns: [
                    [
                        {checkbox: true},
                        {field: 'id', title: __('Id'), sortable: true},
                        {field: 'name', title: __('Name'), operate: 'LIKE'},
                        {field: 'credit_code', title: __('Credit code'), operate: 'LIKE'},
                        {field: 'address', title: __('Address'), operate: 'LIKE'},
                        {field: 'contact_name', title: __('Contact name'), operate: 'LIKE'},
                        {field: 'contact_phone', title: __('Contact phone'), operate: 'LIKE'},
                        {field: 'status', title: __('Status'), searchList: {pending: '待审核', approved: '已通过', rejected: '已驳回'}, formatter: Controller.api.formatter.status},
                        {field: 'invoice_image_path', title: __('Invoice image'), operate: false, formatter: Controller.api.formatter.invoiceImage},
                        {field: 'createtime', title: __('Createtime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'updatetime', title: __('Updatetime'), operate: 'RANGE', addclass: 'datetimerange', formatter: Table.api.formatter.datetime},
                        {field: 'operate', title: __('Operate'), table: table, events: Table.api.events.operate, formatter: operateFormatter}
                    ]
                ]
            });

            Table.api.bindevent(table);

            $(document).off('click.company', '.btn-approve').on('click.company', '.btn-approve', function (e) {
                e.preventDefault();
                var id = $(this).data('id');
                Layer.confirm('确认审核通过？', function (index) {
                    Backend.api.ajax({
                        url: 'company/company/approve',
                        type: 'POST',
                        data: {ids: id}
                    }, function () {
                        Layer.close(index);
                        Toastr.success('操作成功');
                        table.bootstrapTable('refresh');
                    }, function (ret) {
                        Layer.close(index);
                        Toastr.error(ret.msg || '操作失败');
                    });
                });
            });

            $(document).off('click.company', '.btn-reject').on('click.company', '.btn-reject', function (e) {
                e.preventDefault();
                var id = $(this).data('id');
                Layer.confirm('确认驳回？', function (index) {
                    Backend.api.ajax({
                        url: 'company/company/reject',
                        type: 'POST',
                        data: {ids: id}
                    }, function () {
                        Layer.close(index);
                        Toastr.success('操作成功');
                        table.bootstrapTable('refresh');
                    }, function (ret) {
                        Layer.close(index);
                        Toastr.error(ret.msg || '操作失败');
                    });
                });
            });
        },
        add: function () {
            Controller.api.bindevent();
        },
        edit: function () {
            Controller.api.bindevent();
        },
        api: {
            bindevent: function () {
                Form.api.bindevent($("form[role=form]"));
            },
            formatter: {
                status: function (value) {
                    var map = { pending: 'warning', approved: 'success', rejected: 'danger' };
                    var text = { pending: '待审核', approved: '已通过', rejected: '已驳回' };
                    return '<span class="label label-' + (map[value] || 'default') + '">' + (text[value] || value || '-') + '</span>';
                },
                invoiceImage: function (value) {
                    if (!value) return '-';
                    var url = value.indexOf('http') === 0 ? value : ((Config.site && Config.site.api_base_url) ? Config.site.api_base_url : '') + (value.charAt(0) === '/' ? '' : '/') + value;
                    return '<a href="' + url + '" target="_blank" class="img-preview"><img src="' + url + '" class="img-rounded" style="max-width:60px;max-height:60px" onerror="this.style.display=\'none\'"/></a>';
                }
            }
        }
    };
    return Controller;
});
