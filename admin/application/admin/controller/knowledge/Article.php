<?php

namespace app\admin\controller\knowledge;

use app\common\controller\Backend;

/**
 * 知识库管理
 *
 * @icon fa fa-book
 */
class Article extends Backend
{
    /**
     * @var \app\admin\model\KnowledgeArticle
     */
    protected $model = null;

    public function _initialize()
    {
        parent::_initialize();
        $this->model = new \app\admin\model\KnowledgeArticle;
    }
}

