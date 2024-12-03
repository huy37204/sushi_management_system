CREATE PROC getMenuDropDownItem
AS
BEGIN
    -- Tạo bảng tạm để lưu kết quả
    CREATE TABLE #CategoryDish (
        CATEGORY_ID CHAR(4),
        CATEGORY_NAME NVARCHAR(50),
        DISH_NAME NVARCHAR(50)
    );

    -- Lấy 10 CATEGORY_NAME và CATEGORY_ID từ MENU_CATEGORY
    INSERT INTO #CategoryDish (CATEGORY_ID, CATEGORY_NAME, DISH_NAME)
    SELECT 
        mc.CATEGORY_ID, 
        mc.CATEGORY_NAME, 
        d.DISH_NAME
    FROM 
        (SELECT TOP 10 CATEGORY_ID, CATEGORY_NAME FROM MENU_CATEGORY ORDER BY CATEGORY_ID) mc
    LEFT JOIN 
        (SELECT CATEGORY_ID, DISH_NAME, ROW_NUMBER() OVER (PARTITION BY CATEGORY_ID ORDER BY DISH_ID) AS RowNum FROM DISH) d
    ON 
        mc.CATEGORY_ID = d.CATEGORY_ID
    WHERE 
        d.RowNum <= 4;

    -- Trả về kết quả nhóm các món ăn theo CATEGORY_ID
    SELECT 
        CATEGORY_ID,
        CATEGORY_NAME,
        STRING_AGG(DISH_NAME, ', ') AS DISHES
    FROM 
        #CategoryDish
    GROUP BY 
        CATEGORY_ID, CATEGORY_NAME;

    -- Xóa bảng tạm
    DROP TABLE #CategoryDish;
END;
GO

EXEC getMenuDropDownItem