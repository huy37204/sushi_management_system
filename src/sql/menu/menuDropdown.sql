CREATE PROC getMenuDropDownItem
AS
BEGIN
    -- Tạo bảng tạm để lưu kết quả
    CREATE TABLE #CategoryDish (
        CATEGORY_NAME NVARCHAR(50),
        DISH_NAME NVARCHAR(50)
    );

    -- Lấy danh sách các món ăn theo CATEGORY_NAME
    INSERT INTO #CategoryDish (CATEGORY_NAME, DISH_NAME)
    SELECT 
        d.CATEGORY_NAME, 
        d.DISH_NAME
    FROM 
        (SELECT CATEGORY_NAME, DISH_NAME, ROW_NUMBER() OVER (PARTITION BY CATEGORY_NAME ORDER BY DISH_ID) AS RowNum 
         FROM DISH) d
    WHERE 
        d.RowNum <= 4; -- Lấy tối đa 4 món ăn trong mỗi danh mục

    -- Trả về kết quả nhóm các món ăn theo CATEGORY_NAME
    SELECT 
        CATEGORY_NAME,
        STRING_AGG(DISH_NAME, ', ') AS DISHES
    FROM 
        #CategoryDish
    GROUP BY 
        CATEGORY_NAME;

    -- Xóa bảng tạm
    DROP TABLE #CategoryDish;
END;
GO

-- Thực thi thủ tục
EXEC getMenuDropDownItem;

