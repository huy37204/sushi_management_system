USE SUSUSHISHI
GO

CREATE PROCEDURE getUserIdByAccount 
    @USERNAME NVARCHAR(50)
AS
BEGIN
    SELECT 
		AC.PASSWORD,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN AC.EMPLOYEE_ID
            ELSE AC.CUSTOMER_ID 
        END AS Id,
        AC.ROLE,
        CASE 
            WHEN AC.CUSTOMER_ID IS NULL THEN E.FULL_NAME
            ELSE C.FULL_NAME
        END AS Name
    FROM ACCOUNT AC
    LEFT JOIN EMPLOYEE E ON AC.EMPLOYEE_ID = E.EMPLOYEE_ID
    LEFT JOIN CUSTOMER C ON AC.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE AC.USERNAME = @USERNAME 
END

GO
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


GO
CREATE PROC getRevenueByDate
	@DATE DATE,
	@BranchId CHAR(4)
AS
BEGIN
	SELECT * FROM INVOICE I
	JOIN ORDER_ O ON O.ORDER_ID = I.ORDER_ID AND O.BRANCH_ID = @BranchId
	WHERE I.ISSUE_DATE = @DATE
END
EXEC getRevenueByDate @DATE = '10-31-2019', @BranchId = 'B003'

select * from invoice
JOIN ORDER_ O ON O.ORDER_ID = invoice.ORDER_ID AND O.BRANCH_ID = 'B003'
GO
CREATE PROC getRevenueByMonth
    @Year INT,
    @Month INT,
    @BranchId CHAR(4)
AS
BEGIN
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID AND O.BRANCH_ID = @BranchId
    WHERE YEAR(I.ISSUE_DATE) = @Year AND MONTH(I.ISSUE_DATE) = @Month;
END;

EXEC getRevenueByMonth @Year = '1997', @Month = '7', @BranchId = 'B003'

GO
CREATE PROC getRevenueByQuarter
    @Year INT,
    @Quarter INT,
    @BranchId CHAR(4)
AS
BEGIN
    DECLARE @StartDate DATE;
    DECLARE @EndDate DATE;

    -- Tính toán phạm vi ngày của quý
    IF @Quarter = 1
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-01-01'; -- Ngày bắt đầu quý 1
        SET @EndDate = CAST(@Year AS VARCHAR) + '-03-31'; -- Ngày kết thúc quý 1
    END
    ELSE IF @Quarter = 2
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-04-01'; -- Ngày bắt đầu quý 2
        SET @EndDate = CAST(@Year AS VARCHAR) + '-06-30'; -- Ngày kết thúc quý 2
    END
    ELSE IF @Quarter = 3
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-07-01'; -- Ngày bắt đầu quý 3
        SET @EndDate = CAST(@Year AS VARCHAR) + '-09-30'; -- Ngày kết thúc quý 3
    END
    ELSE IF @Quarter = 4
    BEGIN
        SET @StartDate = CAST(@Year AS VARCHAR) + '-10-01'; -- Ngày bắt đầu quý 4
        SET @EndDate = CAST(@Year AS VARCHAR) + '-12-31'; -- Ngày kết thúc quý 4
    END

    -- Truy vấn các hóa đơn theo quý
    SELECT *
    FROM INVOICE I
    JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
    AND I.ISSUE_DATE BETWEEN @StartDate AND @EndDate
END
SELECT * FROM INVOICE
EXEC getRevenueByQuarter @Year = 2022, @Quarter = 2, @BranchId = 'B003';

GO
CREATE PROC getRevenueByYear
	@Year INT,
    @BranchId CHAR(4)
AS
BEGIN
	SELECT *
	FROM INVOICE I
	JOIN ORDER_ O ON I.ORDER_ID = O.ORDER_ID
    WHERE O.BRANCH_ID = @BranchId
	AND YEAR(I.ISSUE_DATE) = @Year
END


EXEC getRevenueByYear @Year = 2024, @BranchId = 'B003'
	SELECT *, D.DEPARTMENT_ID, D.DEPARTMENT_NAME
	FROM EMPLOYEE E
	JOIN DEPARTMENT D ON D.DEPARTMENT_ID = E.DEPARTMENT_ID AND D.BRANCH_ID = 'B003'
SELECT * FROM DEPARTMENT
select * from dish

UPDATE INVOICE
SET DISCOUNT_AMOUNT = (
    SELECT MS.DISCOUNT_AMOUNT
    FROM MEMBERSHIP_CARD MS
    JOIN CUSTOMER C ON C.CUSTOMER_ID = MS.CUSTOMER_ID
    JOIN ORDER_ O ON O.CUSTOMER_ID = C.CUSTOMER_ID
    WHERE INVOICE.ORDER_ID = O.ORDER_ID

);

SELECT * FROM MEMBERSHIP_CARD
UPDATE Invoice
SET FINAL_AMOUNT = (
    SELECT 
        CASE 
            WHEN SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT < 0 THEN 0
            ELSE SUM(od.QUANTITY * d.DISH_PRICE) - DISCOUNT_AMOUNT
        END
    FROM ORDER_DISH od
    JOIN DISH d ON od.DISH_ID = d.DISH_ID
    WHERE od.ORDER_ID = Invoice.ORDER_ID
);


SELECT * 
FROM INVOICE
JOIN ORDER_ O ON O.ORDER_ID = INVOICE.ORDER_ID AND O.BRANCH_ID = 'B003'
SELECT * FROM DISH
select * from ORDER_DISH
select * from ORDER_
select * from ACCOUNT
select * from invoice WHERE YEAR(ISSUE_DATE) = '1997'